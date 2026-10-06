import api from './axios'

export const getInteractions = async (patientId, limit = 50) => {
  const { data } = await api.get(`/patients/${patientId}/interactions/?limit=${limit}`)
  return data
}

export const logInteraction = async (patientId, interaction) => {
  const { data } = await api.post(`/patients/${patientId}/interactions/`, interaction)
  return data
}

export const getPersonInteractions = async (patientId, personId) => {
  const { data } = await api.get(`/patients/${patientId}/people/${personId}/interactions`)
  return data
}
