import { google } from 'googleapis'
import fs from 'fs'
import stream from 'stream'
import { createClient } from '@supabase/supabase-js'
import formidable from 'formidable'

export const config = {
  api: {
    bodyParser: false,
  },
}

function getAuthClient() {
  const scopes = ['https://www.googleapis.com/auth/drive']

  // Support base64-encoded JSON (same as Demo Project)
  const jsonB64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64
  if (jsonB64) {
    try {
      const decoded = Buffer.from(jsonB64, 'base64').toString('utf8')
      const parsed = JSON.parse(decoded)
      if (parsed.client_email && parsed.private_key) {
        return new google.auth.JWT(parsed.client_email, null, parsed.private_key, scopes)
      }
    } catch (e) {
      console.warn('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON_B64', e.message)
    }
  }

  // Fallback: raw JSON string
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT
  if (serviceAccountJson) {
    const credentials = JSON.parse(serviceAccountJson)
    const privateKey = credentials.private_key.replace(/\\n/g, '\n')
    return new google.auth.JWT(credentials.client_email, null, privateKey, scopes)
  }

  throw new Error('Missing Google Drive credentials (GOOGLE_SERVICE_ACCOUNT_JSON_B64 or GOOGLE_SERVICE_ACCOUNT)')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const contentType = req.headers['content-type'] || ''
  if (!contentType.includes('multipart/form-data')) {
    return res.status(400).json({ success: false, error: 'Expected multipart/form-data' })
  }

  const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

  try {
    const form = formidable({ keepExtensions: true, maxFileSize: MAX_FILE_SIZE })
    
    const parsed = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err)
        resolve({ fields, files })
      })
    })

    const { fields, files } = parsed
    const visitId = fields && (fields.visit_id || fields.visitId || fields.call_id) || null

    let fileObj = (files && (files.file || files.file_upload || files.upload)) || null
    if (!fileObj && files) {
      const vals = Object.values(files)
      if (vals.length > 0) fileObj = vals[0]
    }

    if (!fileObj) {
      return res.status(400).json({ success: false, error: 'No file uploaded' })
    }

    if (Array.isArray(fileObj)) fileObj = fileObj[0]

    const filePath = fileObj.filepath || fileObj.path || fileObj.file
    const mimeType = fileObj.mimetype || fileObj.type || fileObj.mime || 'audio/mpeg'
    const originalFilename = fileObj.originalFilename || fileObj.name || fileObj.filename || 'audio.mp3'

    const buffer = await fs.promises.readFile(filePath)

    const auth = getAuthClient()
    if (typeof auth.authorize === 'function') {
      await auth.authorize()
    }
    
    const drive = google.drive({ version: 'v3', auth })
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
    if (!folderId) {
      return res.status(500).json({ success: false, error: 'Missing GOOGLE_DRIVE_FOLDER_ID' })
    }

    const finalFileName = `${visitId ? visitId + '_' : ''}${Date.now()}_${originalFilename}`
    
    const bufferStream = new stream.PassThrough()
    bufferStream.end(buffer)

    const driveRes = await drive.files.create({
      requestBody: {
        name: finalFileName,
        parents: [folderId],
      },
      media: {
        mimeType,
        body: bufferStream,
      },
      fields: 'id, webViewLink',
      supportsAllDrives: true,
    })

    const fileId = driveRes.data.id

    // Make file viewable by anyone with the link
    try {
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      })
    } catch (permErr) {
      console.warn('Failed to make file public', permErr)
    }

    const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`

    // Update Supabase if we have a visitId
    let inserted = null
    if (visitId) {
      try {
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )
        const { data, error } = await supabase
          .from('visits')
          .update({
            audio_url: previewUrl,
            audio_file_id: fileId
          })
          .eq('id', visitId)
          .select()
          
        if (error) throw error
        inserted = data
      } catch (dbErr) {
        console.warn('Failed to update visit with audio URL', dbErr)
      }
    }

    // Clean up tmp file
    await fs.promises.unlink(filePath).catch(console.error)

    return res.status(200).json({ success: true, fileId, url: previewUrl, supabase: inserted })
  } catch (err) {
    console.error('Upload error', err)
    const rawMessage = err?.response?.data?.error?.message || err?.message || 'Internal error'
    return res.status(err.status || 500).json({ success: false, error: rawMessage })
  }
}
