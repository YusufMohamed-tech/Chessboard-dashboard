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

    const buffer = await fs.promises.readFile(filePath)

    // Setup Google Drive Client
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT
    if (!serviceAccountJson) {
      return res.status(500).json({ success: false, error: 'Missing GOOGLE_SERVICE_ACCOUNT env var' })
    }

    let credentials
    try {
      credentials = JSON.parse(serviceAccountJson)
    } catch (e) {
      return res.status(500).json({ success: false, error: 'Invalid GOOGLE_SERVICE_ACCOUNT JSON' })
    }

    const scopes = ['https://www.googleapis.com/auth/drive']
    const delegatedUser = process.env.GOOGLE_IMPERSONATE_USER

    // Service accounts cannot upload to personal "My Drive" directly.
    // Use a Shared Drive folder, or enable domain-wide delegation and impersonate a user.
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes,
      subject: delegatedUser || undefined,
    })
    
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
    const previewUrl = driveRes.data.webViewLink

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
    const isServiceAccountQuotaError =
      typeof rawMessage === 'string' &&
      rawMessage.toLowerCase().includes('service accounts do not have storage quota')

    const error = isServiceAccountQuotaError
      ? 'Google Drive upload failed: service accounts cannot use personal My Drive storage. Put GOOGLE_DRIVE_FOLDER_ID inside a Shared Drive and share it with the service account, or set GOOGLE_IMPERSONATE_USER with domain-wide delegation.'
      : rawMessage

    return res.status(err.status || 500).json({ success: false, error })
  }
}
