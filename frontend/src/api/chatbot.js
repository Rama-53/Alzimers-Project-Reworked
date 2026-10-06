import api from './axios'

export const sendChatMessage = async (patientId, chatData) => {
  const { data } = await api.post(`/patients/${patientId}/chat`, chatData)
  return data
}

export const getChatbotStatus = async (patientId) => {
  const { data } = await api.get(`/patients/${patientId}/chat/status`)
  return data
}

export const triggerAutoGreet = async (patientId, personId) => {
  const { data } = await api.post(`/patients/${patientId}/chat/auto-greet`, { person_id: personId })
  return data
}
