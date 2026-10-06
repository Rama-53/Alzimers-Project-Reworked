import React, { useState, useEffect } from 'react'
import { Image, AlertCircle, Plus } from 'lucide-react'
import { usePatient } from '../context/PatientContext'
import { getPeople } from '../api/people'

export default function Gallery() {
  const { selectedPatient } = usePatient()
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedPatient) {
      getPeople(selectedPatient.id)
        .then(setPeople)
        .catch(() => setPeople([]))
    }
  }, [selectedPatient])

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h3 mb-1 font-bold d-flex align-items-center gap-2">
            <Image className="text-warning" size={28} />
            Photo Gallery
          </h1>
          <p className="text-secondary text-sm mb-0">
            Registered face photos and photo albums per person
          </p>
        </div>
      </div>

      {!selectedPatient ? (
        <div className="alert alert-warning d-flex align-items-center gap-2">
          <AlertCircle size={20} />
          Please select a patient to view photo gallery albums.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {people.map((person) => (
            <div key={person.id} className="card glass-panel p-4">
              <h3 className="h5 font-bold mb-2">{person.name}</h3>
              <p className="text-xs text-muted mb-3">{person.relationship}</p>
              <div className="p-3 bg-secondary rounded text-center text-xs text-muted">
                {person.photos?.length || 0} registered face photo(s)
              </div>
            </div>
          ))}

          {people.length === 0 && (
            <div className="col-span-full card glass-panel p-5 text-center">
              <Image size={48} className="text-muted mx-auto mb-3" />
              <h3 className="h4 font-bold mb-2">No Photo Albums Found</h3>
              <p className="text-secondary text-sm mb-0">
                Register people and upload reference face photos in Manage People.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
