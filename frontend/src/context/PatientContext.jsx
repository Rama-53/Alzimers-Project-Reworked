import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getPatients } from '../api/patients'

const PatientContext = createContext(null)

export function PatientProvider({ children }) {
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessionPersonIds, setSessionPersonIds] = useState([])

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getPatients()
      setPatients(data)

      // Restore previously selected patient from localStorage
      const savedId = localStorage.getItem('alzheimer-patient-id')
      if (savedId) {
        const saved = data.find(p => p.id === savedId)
        if (saved) {
          setSelectedPatient(saved)
        } else if (data.length > 0) {
          selectPatientInternal(data[0])
        }
      } else if (data.length > 0) {
        selectPatientInternal(data[0])
      }
    } catch (err) {
      console.error('Failed to fetch patients:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const selectPatientInternal = (patient) => {
    setSelectedPatient(patient)
    setSessionPersonIds([]) // Reset camera session on patient change
    localStorage.setItem('alzheimer-patient-id', patient.id)
  }

  const selectPatient = (patient) => {
    selectPatientInternal(patient)
  }

  /** Add a recognized person to the current session */
  const addSessionPerson = (personId) => {
    setSessionPersonIds(prev => {
      if (prev.includes(personId)) return prev
      return [...prev, personId]
    })
  }

  /** Clear all session-recognized people */
  const clearSession = () => setSessionPersonIds([])

  return (
    <PatientContext.Provider
      value={{
        patients,
        selectedPatient,
        loading,
        sessionPersonIds,
        selectPatient,
        addSessionPerson,
        clearSession,
        refreshPatients: fetchPatients,
      }}
    >
      {children}
    </PatientContext.Provider>
  )
}

export function usePatient() {
  const ctx = useContext(PatientContext)
  if (!ctx) throw new Error('usePatient must be used within PatientProvider')
  return ctx
}
