import React, { useState, useEffect } from 'react'
import { Users, UserPlus, AlertCircle, Trash2, Edit, Plus, Image, Eye, Upload, Save, X } from 'lucide-react'
import { usePatient } from '../context/PatientContext'
import { getPeople, addPerson, updatePerson, deletePerson, addPhotoToPerson, deletePhotoFromPerson } from '../api/people'
import Modal from '../components/Common/Modal'
import Badge from '../components/Common/Badge'

export default function ManagePeople() {
  const { selectedPatient } = usePatient()

  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPhotosModalOpen, setIsPhotosModalOpen] = useState(false)
  const [activePerson, setActivePerson] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'Family Member',
    key_memories: '',
    conversation_hints: '',
    photos: [],
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  // Single photo upload state for photos modal
  const [newPhotoFile, setNewPhotoFile] = useState(null)
  const [photoUploading, setPhotoUploading] = useState(false)

  const relationships = [
    'Spouse',
    'Child',
    'Grandchild',
    'Sibling',
    'Caregiver',
    'Doctor',
    'Friend',
    'Neighbor',
    'Relative',
    'Other',
  ]

  useEffect(() => {
    if (selectedPatient) {
      fetchPeople()
    }
  }, [selectedPatient])

  const fetchPeople = async () => {
    if (!selectedPatient) return
    setLoading(true)
    setError('')
    try {
      const data = await getPeople(selectedPatient.id)
      setPeople(data)
    } catch (err) {
      setError('Failed to fetch people list.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Add Person Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setFormError('Name is required')
      return
    }
    setFormLoading(true)
    setFormError('')

    try {
      const data = new FormData()
      data.append('name', formData.name)
      data.append('relationship', formData.relationship)
      data.append('key_memories', formData.key_memories)
      data.append('conversation_hints', formData.conversation_hints)

      if (formData.photos && formData.photos.length > 0) {
        for (let i = 0; i < formData.photos.length; i++) {
          data.append('photos', formData.photos[i])
        }
      }

      await addPerson(selectedPatient.id, data)
      setIsAddModalOpen(false)
      resetForm()
      fetchPeople()
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to add person.')
    } finally {
      setFormLoading(false)
    }
  }

  // Handle Edit Person Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!activePerson || !formData.name.trim()) return
    setFormLoading(true)
    setFormError('')

    try {
      const data = new FormData()
      data.append('name', formData.name)
      data.append('relationship', formData.relationship)
      data.append('key_memories', formData.key_memories)
      data.append('conversation_hints', formData.conversation_hints)

      await updatePerson(selectedPatient.id, activePerson.id, data)
      setIsEditModalOpen(false)
      setActivePerson(null)
      resetForm()
      fetchPeople()
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to update person.')
    } finally {
      setFormLoading(false)
    }
  }

  const openEditModal = (person) => {
    setActivePerson(person)
    setFormData({
      name: person.name,
      relationship: person.relationship,
      key_memories: person.key_memories || '',
      conversation_hints: person.conversation_hints || '',
      photos: [],
    })
    setIsEditModalOpen(true)
  }

  const openPhotosModal = (person) => {
    setActivePerson(person)
    setIsPhotosModalOpen(true)
  }

  const handleDeletePerson = async (personId) => {
    if (!window.confirm('Are you sure you want to remove this person and all associated face embeddings?')) return
    try {
      await deletePerson(selectedPatient.id, personId)
      fetchPeople()
    } catch (err) {
      alert('Failed to delete person.')
    }
  }

  const handleAddPhotoSubmit = async (e) => {
    e.preventDefault()
    if (!newPhotoFile || !activePerson) return
    setPhotoUploading(true)

    try {
      const data = new FormData()
      data.append('file', newPhotoFile)
      await addPhotoToPerson(selectedPatient.id, activePerson.id, data)
      setNewPhotoFile(null)
      fetchPeople()
      // Refresh activePerson local state
      const updated = await getPeople(selectedPatient.id)
      const freshActive = updated.find((p) => p.id === activePerson.id)
      if (freshActive) setActivePerson(freshActive)
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add photo.')
    } finally {
      setPhotoUploading(false)
    }
  }

  const handleDeletePhoto = async (photoFilename) => {
    if (!activePerson || !window.confirm('Delete this photo?')) return
    try {
      await deletePhotoFromPerson(selectedPatient.id, activePerson.id, photoFilename)
      fetchPeople()
      const updated = await getPeople(selectedPatient.id)
      const freshActive = updated.find((p) => p.id === activePerson.id)
      if (freshActive) setActivePerson(freshActive)
    } catch (err) {
      alert('Failed to delete photo.')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      relationship: 'Family Member',
      key_memories: '',
      conversation_hints: '',
      photos: [],
    })
    setFormError('')
  }

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div>
          <h1 className="h3 mb-1 font-bold d-flex align-items-center gap-2">
            <Users className="text-info" size={28} />
            Manage Known People
          </h1>
          <p className="text-secondary text-sm mb-0">
            Register face photos, relationships, and key memories for face recognition & AI chatbot
          </p>
        </div>

        {selectedPatient && (
          <button
            onClick={() => {
              resetForm()
              setIsAddModalOpen(true)
            }}
            className="btn btn-primary d-flex align-items-center gap-2"
          >
            <UserPlus size={18} /> Register New Person
          </button>
        )}
      </div>

      {!selectedPatient ? (
        <div className="alert alert-warning d-flex align-items-center gap-2">
          <AlertCircle size={20} />
          <span>Please select a patient to manage registered people.</span>
        </div>
      ) : loading ? (
        <div className="text-center py-5 text-secondary">
          <div className="spinner-border mb-2" role="status"></div>
          <p className="text-sm">Loading people database...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger mb-4">{error}</div>
      ) : people.length === 0 ? (
        <div className="card glass-panel p-5 text-center">
          <Users size={48} className="text-muted mx-auto mb-3" />
          <h3 className="h4 font-bold mb-2">No Registered People Found</h3>
          <p className="text-secondary text-sm max-w-md mx-auto mb-4">
            Add family members, caregivers, or friends with facial photos so the AI system can identify them when they visit.
          </p>
          <button
            onClick={() => {
              resetForm()
              setIsAddModalOpen(true)
            }}
            className="btn btn-primary mx-auto d-inline-flex align-items-center gap-2"
          >
            <UserPlus size={18} /> Register First Person
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {people.map((person) => (
            <div key={person.id} className="card glass-panel p-4 position-relative d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex align-items-start justify-content-between mb-2">
                  <div>
                    <h3 className="h5 font-bold mb-1">{person.name}</h3>
                    <Badge variant="primary">{person.relationship}</Badge>
                  </div>

                  <div className="d-flex align-items-center gap-1">
                    <button
                      onClick={() => openEditModal(person)}
                      className="btn btn-secondary p-1 text-primary"
                      title="Edit Info"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeletePerson(person.id)}
                      className="btn btn-secondary p-1 text-danger"
                      title="Delete Person"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {person.key_memories && (
                  <div className="p-2 bg-dark rounded text-xs mb-2">
                    <strong className="text-warning">Key Memories:</strong>
                    <p className="mb-0 text-secondary mt-1 text-truncate-2">{person.key_memories}</p>
                  </div>
                )}

                {person.conversation_hints && (
                  <div className="p-2 bg-dark rounded text-xs mb-3">
                    <strong className="text-info">Chat Hints:</strong>
                    <p className="mb-0 text-secondary mt-1 text-truncate-2">{person.conversation_hints}</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-top d-flex align-items-center justify-content-between">
                <span className="text-xs text-muted d-flex align-items-center gap-1">
                  <Image size={14} /> {person.photos?.length || 0} Photo(s)
                </span>
                <button
                  onClick={() => openPhotosModal(person)}
                  className="btn btn-secondary btn-xs d-flex align-items-center gap-1 text-xs"
                >
                  <Eye size={12} /> View / Add Photos
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Add Person */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New Person">
        <form onSubmit={handleAddSubmit}>
          {formError && <div className="alert alert-danger text-sm mb-3">{formError}</div>}

          <div className="form-group mb-3">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Sarah Jenkins"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group mb-3">
            <label className="form-label">Relationship to Patient *</label>
            <select
              className="form-select"
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
            >
              {relationships.map((rel) => (
                <option key={rel} value={rel}>
                  {rel}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group mb-3">
            <label className="form-label">Key Memories / Life Stories</label>
            <textarea
              className="form-control"
              rows="2"
              placeholder="Shared memories, childhood nicknames, memorable events..."
              value={formData.key_memories}
              onChange={(e) => setFormData({ ...formData, key_memories: e.target.value })}
            ></textarea>
          </div>

          <div className="form-group mb-3">
            <label className="form-label">Conversation Hints (for AI Chatbot)</label>
            <textarea
              className="form-control"
              rows="2"
              placeholder="Topics to bring up, comforting phrases, hobbies..."
              value={formData.conversation_hints}
              onChange={(e) => setFormData({ ...formData, conversation_hints: e.target.value })}
            ></textarea>
          </div>

          <div className="form-group mb-4">
            <label className="form-label">Face Reference Photos (JPEG / PNG)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              className="form-control text-sm"
              onChange={(e) => setFormData({ ...formData, photos: Array.from(e.target.files) })}
            />
            <span className="text-xs text-muted mt-1 d-block">
              Upload clear, well-lit photos showing face from various angles.
            </span>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={formLoading}>
              {formLoading ? 'Saving Person...' : 'Register Person'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Edit Person */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Person Details">
        <form onSubmit={handleEditSubmit}>
          {formError && <div className="alert alert-danger text-sm mb-3">{formError}</div>}

          <div className="form-group mb-3">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group mb-3">
            <label className="form-label">Relationship</label>
            <select
              className="form-select"
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
            >
              {relationships.map((rel) => (
                <option key={rel} value={rel}>
                  {rel}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group mb-3">
            <label className="form-label">Key Memories</label>
            <textarea
              className="form-control"
              rows="2"
              value={formData.key_memories}
              onChange={(e) => setFormData({ ...formData, key_memories: e.target.value })}
            ></textarea>
          </div>

          <div className="form-group mb-4">
            <label className="form-label">Conversation Hints</label>
            <textarea
              className="form-control"
              rows="2"
              value={formData.conversation_hints}
              onChange={(e) => setFormData({ ...formData, conversation_hints: e.target.value })}
            ></textarea>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={formLoading}>
              {formLoading ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: View & Manage Photos */}
      <Modal
        isOpen={isPhotosModalOpen}
        onClose={() => setIsPhotosModalOpen(false)}
        title={`Photos for ${activePerson?.name || 'Person'}`}
      >
        <div>
          {/* Add new photo form */}
          <form onSubmit={handleAddPhotoSubmit} className="mb-4 p-3 bg-secondary rounded-lg">
            <label className="form-label text-xs font-bold text-uppercase mb-2">Upload New Reference Photo</label>
            <div className="d-flex gap-2">
              <input
                type="file"
                accept="image/*"
                className="form-control text-sm"
                onChange={(e) => setNewPhotoFile(e.target.files[0])}
              />
              <button type="submit" className="btn btn-primary btn-sm px-3" disabled={!newPhotoFile || photoUploading}>
                {photoUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </form>

          {/* Photo list */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {activePerson?.photos?.map((photo, idx) => (
              <div key={idx} className="position-relative group rounded-lg overflow-hidden bg-dark">
                <img
                  src={`/api/patients/${selectedPatient.id}/people/${activePerson.id}/photos/${photo}`}
                  alt={`Face photo ${idx}`}
                  className="w-100 h-120 object-fit-cover rounded-lg"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/150?text=Photo'
                  }}
                />
                <button
                  onClick={() => handleDeletePhoto(photo)}
                  className="position-absolute top-2 right-2 btn btn-danger btn-xs p-1 rounded-circle"
                  title="Delete Photo"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            {(!activePerson?.photos || activePerson.photos.length === 0) && (
              <div className="col-span-full text-center py-4 text-xs text-muted">
                No photos uploaded yet for this person.
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
