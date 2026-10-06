import React, { useState } from 'react'
import { UserCheck, Plus, User } from 'lucide-react'
import { usePatient } from '../../context/PatientContext'

export default function PatientSelector({ onOpenAddModal }) {
  const { patients, selectedPatient, setSelectedPatient, loading } = usePatient()

  return (
    <div className="d-flex align-items-center gap-2">
      <div className="d-flex align-items-center gap-2">
        <User size={18} className="text-secondary" />
        <select
          className="form-select text-sm py-1"
          style={{ width: 'auto', minWidth: '180px' }}
          value={selectedPatient ? selectedPatient.id : ''}
          onChange={(e) => {
            const patient = patients.find((p) => p.id === e.target.value)
            if (patient) setSelectedPatient(patient)
          }}
          disabled={loading}
        >
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name} ({p.stage})
            </option>
          ))}
        </select>
      </div>
      {onOpenAddModal && (
        <button
          onClick={onOpenAddModal}
          className="btn btn-secondary btn-sm"
          title="Add New Patient"
        >
          <Plus size={16} />
        </button>
      )}
    </div>
  )
}
