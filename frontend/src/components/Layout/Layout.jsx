import React, { useState } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Modal from '../Common/Modal'
import { usePatient } from '../../context/PatientContext'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false)

  const { addPatient, setSelectedPatient } = usePatient()
  const [formData, setFormData] = useState({
    full_name: '',
    stage: 'Early',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAddPatientSubmit = async (e) => {
    e.preventDefault()
    if (!formData.full_name.trim()) {
      setError('Patient name is required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const newP = await addPatient(formData)
      setSelectedPatient(newP)
      setIsAddPatientOpen(false)
      setFormData({ full_name: '', stage: 'Early', notes: '' })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add patient')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenAddPatientModal={() => setIsAddPatientOpen(true)}
      />

      <div className="layout-body">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="main-content">{children}</main>
      </div>

      {/* Add Patient Modal */}
      <Modal
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        title="Add New Patient"
      >
        <form onSubmit={handleAddPatientSubmit}>
          {error && <div className="alert alert-warning mb-3">{error}</div>}
          <div className="form-group mb-3">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. John Doe"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>

          <div className="form-group mb-3">
            <label className="form-label">Alzheimer's Stage</label>
            <select
              className="form-select"
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
            >
              <option value="Early">Early Stage</option>
              <option value="Moderate">Moderate Stage</option>
              <option value="Severe">Severe Stage</option>
            </select>
          </div>

          <div className="form-group mb-4">
            <label className="form-label">Care Notes</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Primary interests, preferences, triggers, routines..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            ></textarea>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsAddPatientOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Patient'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
