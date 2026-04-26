import { google } from 'googleapis'
import fs from 'fs'
import { createClient } from '@supabase/supabase-js'
import formidable from 'formidable'

export const config = {
  api: {
    bodyParser: false,
  },
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

    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT)

    const privateKey = credentials.private_key.replace(/\\n/g, '\n')
    
    const auth = new google.auth.JWT(
      credentials.client_email,
      null,
      privateKey,
      ['https://www.googleapis.com/auth/drive']
    )
    
    if (typeof auth.authorize === 'function') {
      await auth.authorize()
    }
    
    const drive = google.drive({ version: 'v3', auth })
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
    if (!folderId) {
      return res.status(500).json({ success: false, error: 'Missing GOOGLE_DRIVE_FOLDER_ID' })
    }

    const finalFileName = `${visitId ? visitId + '_' : ''}${Date.now()}_${originalFilename}`
    
    const media = {
      mimeType,
      body: fs.createReadStream(filePath),
    }

    const driveRes = await drive.files.create({
      requestBody: {
        name: finalFileName,
        parents: [folderId],
      },
      media: media,
      supportsAllDrives: true,
      fields: 'id, webViewLink, webContentLink',
    })

    const fileId = driveRes.data.id
    let previewUrl = driveRes.data.webViewLink

    try {
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      })
      previewUrl = `https://drive.google.com/file/d/${fileId}/preview`
    } catch (permErr) {
      console.warn('Failed to make file public', permErr)
    }

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
