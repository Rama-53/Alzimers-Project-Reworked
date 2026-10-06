import api from './axios'

export const getPeople = async (patientId) => {
  const { data } = await api.get(`/patients/${patientId}/people/`)
  return data
}

export const getPerson = async (patientId, personId) => {
  const { data } = await api.get(`/patients/${patientId}/people/${personId}`)
  return data
}

export const addPerson = async (patientId, formData) => {
  const { data } = await api.post(`/patients/${patientId}/people/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export const updatePerson = async (patientId, personId, formData) => {
  const { data } = await api.put(`/patients/${patientId}/people/${personId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export const deletePerson = async (patientId, personId) => {
  const { data } = await api.delete(`/patients/${patientId}/people/${personId}`)
  return data
}

export const addPhotoToPerson = async (patientId, personId, formData) => {
  const { data } = await api.post(`/patients/${patientId}/people/${personId}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export const deletePhotoFromPerson = async (patientId, personId, photoFilename) => {
  const { data } = await api.delete(`/patients/${patientId}/people/${personId}/photos/${photoFilename}`)
  return data
}
