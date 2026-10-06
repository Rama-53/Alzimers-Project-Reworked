import React, { useState, useEffect } from 'react'
import { Users, UserPlus, AlertCircle, Trash2, Edit, Plus } from 'lucide-react'
import { usePatient } from '../context/PatientContext'
import { getPeople, deletePerson } from '../api/people'
import Modal from '../components/Common/Modal'
import Badge from '../components/Common/Badge'

export default function ManagePeople() {
  const { selectedPatient } = usePatient()
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (selectedPatient) {
      fetchPeople()
    }
  }, [selectedPatient])

  const fetchPeople = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getPeople(selectedPatient.id)
      setPeople(data)
    } catch (err) {
      setError('Failed to fetch people list')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (personId) => {
    if (!window.confirm('Are you sure you want to delete this person?')) return
    try {
      await deletePerson(selectedPatient.id, personId)
      fetchPeople()
    } catch (err) {
      alert('Failed to delete person')
    }
  }

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h3 mb-1 font-bold d-flex align-items-center gap-2">
            <Users className="text-info" size={28} />
            Manage Known People
          </h1>
          <p className="text-secondary text-sm mb-0">
            Registered family members, caregivers, and friends
          </p>
        </div>
        {selectedPatient && (
          <button className="btn btn-primary d-flex align-items-center gap-2">
            <UserPlus size={18} /> Add Person
          </button>
        )}
      </div>

      {!selectedPatient ? (
        <div className="alert alert-warning d-flex align-items-center gap-2">
          <AlertCircle size={20} />
          Please select a patient to view registered people.
        </div>
      ) : loading ? (
        <div className="text-center py-5 text-secondary">Loading people...</div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : people.length === 0 ? (
        <div className="card glass-panel p-5 text-center">
          <Users size={48} className="text-muted mx-auto mb-3" />
          <h3 className="h4 font-bold mb-2">No Registered People Yet</h3>
          <p className="text-secondary text-sm mb-4">
            Add family members, friends, or caregivers so the AI system can recognize them.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {people.map((person) => (
            <div key={person.id} className="card glass-panel p-4 position-relative">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h3 className="h5 font-bold mb-1">{person.name}</h3>
                  <Badge variant="primary">{person.relationship}</Badge>
                </div>
                <button
                  onClick={() => handleDelete(person.id)}
                  className="btn btn-secondary p-1 text-danger"
                  title="Delete Person"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {person.key_memories && (
                <div className="text-xs text-secondary mb-2">
                  <strong>Memories:</strong> {person.key_memories}
                </div>
              )}

              {person.conversation_hints && (
                <div className="text-xs text-muted mb-3">
                  <strong>Hints:</strong> {person.conversation_hints}
                </div>
              )}

              <div className="text-xs text-muted d-flex justify-content-between align-items-center pt-2 border-top">
                <span>{person.photos?.length || 0} Photo(s) registered</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
