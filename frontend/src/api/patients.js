import api from './axios'

export const getPatients = async () => {
  const { data } = await api.get('/patients/')
  return data
}

export const createPatient = async (patient) => {
  const { data } = await api.post('/patients/', patient)
  return data
}

export const getPatient = async (id) => {
  const { data } = await api.get(`/patients/${id}`)
  return data
}

export const updatePatient = async (id, updates) => {
  const { data } = await api.put(`/patients/${id}`, updates)
  return data
}

export const deletePatient = async (id) => {
  const { data } = await api.delete(`/patients/${id}`)
  return data
}
