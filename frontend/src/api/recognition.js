import api from './axios'

export const recognizeImage = async (patientId, imageFile, tolerance = 0.6) => {
  const formData = new FormData()
  formData.append('file', imageFile)
  const { data } = await api.post(
    `/patients/${patientId}/recognition/recognize?tolerance=${tolerance}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return data
}
