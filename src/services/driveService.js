export async function uploadAudioFile(file, visitId) {
  if (!file) throw new Error('No file provided')

  const formData = new FormData()
  formData.append('file_upload', file)
  if (visitId) {
    formData.append('call_id', visitId)
  }

  const response = await fetch('/api/upload-audio.cjs', {
    method: 'POST',
    body: formData,
  })

  const result = await response.json()
  
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to upload audio file')
  }

  return result
}
