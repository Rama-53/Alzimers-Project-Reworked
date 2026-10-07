import React, { useState, useEffect } from 'react'
import { Image, AlertCircle, Eye, Filter, User, X } from 'lucide-react'
import { usePatient } from '../context/PatientContext'
import { getPeople } from '../api/people'
import Modal from '../components/Common/Modal'
import Badge from '../components/Common/Badge'

export default function Gallery() {
  const { selectedPatient } = usePatient()
  const [people, setPeople] = useState([])
  const [selectedPersonFilter, setSelectedPersonFilter] = useState('ALL')
  const [loading, setLoading] = useState(false)

  // Preview modal state
  const [previewPhoto, setPreviewPhoto] = useState(null)

  useEffect(() => {
    if (selectedPatient) {
      fetchGalleryData()
    }
  }, [selectedPatient])

  const fetchGalleryData = async () => {
    if (!selectedPatient) return
    setLoading(true)
    try {
      const data = await getPeople(selectedPatient.id)
      setPeople(data)
    } catch (err) {
      setPeople([])
    } finally {
      setLoading(false)
    }
  }

  // Filter people list
  const filteredPeople =
    selectedPersonFilter === 'ALL'
      ? people
      : people.filter((p) => p.id === selectedPersonFilter)

  // Extract all photos across filtered people
  const allPhotos = []
  filteredPeople.forEach((p) => {
    if (p.photos && p.photos.length > 0) {
      p.photos.forEach((photoFilename) => {
        allPhotos.push({
          personId: p.id,
          personName: p.name,
          relationship: p.relationship,
          filename: photoFilename,
          url: `/api/patients/${selectedPatient.id}/people/${p.id}/photos/${photoFilename}`,
        })
      })
    }
  })

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div>
          <h1 className="h3 mb-1 font-bold d-flex align-items-center gap-2">
            <Image className="text-warning" size={28} />
            Photo & Face Memory Gallery
          </h1>
          <p className="text-secondary text-sm mb-0">
            Reference face photo collections for ArcFace recognition indexing
          </p>
        </div>

        {/* Person filter dropdown */}
        {selectedPatient && people.length > 0 && (
          <div className="d-flex align-items-center gap-2">
            <Filter size={18} className="text-secondary" />
            <select
              className="form-select text-sm py-1"
              style={{ minWidth: '180px' }}
              value={selectedPersonFilter}
              onChange={(e) => setSelectedPersonFilter(e.target.value)}
            >
              <option value="ALL">All Registered People ({people.length})</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.relationship})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!selectedPatient ? (
        <div className="alert alert-warning d-flex align-items-center gap-2">
          <AlertCircle size={20} />
          <span>Please select a patient to view the photo memory gallery.</span>
        </div>
      ) : loading ? (
        <div className="text-center py-5 text-secondary">
          <div className="spinner-border mb-2" role="status"></div>
          <p className="text-sm">Loading photo albums...</p>
        </div>
      ) : allPhotos.length === 0 ? (
        <div className="card glass-panel p-5 text-center">
          <Image size={48} className="text-muted mx-auto mb-3" />
          <h3 className="h4 font-bold mb-2">No Photos Found</h3>
          <p className="text-secondary text-sm max-w-md mx-auto mb-0">
            Upload reference face photos in "Manage People" to build photo memory albums for ArcFace matching.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allPhotos.map((item, idx) => (
            <div
              key={idx}
              className="card glass-panel p-2 position-relative group cursor-pointer overflow-hidden"
              onClick={() => setPreviewPhoto(item)}
            >
              <div className="position-relative bg-dark rounded-lg overflow-hidden" style={{ height: '180px' }}>
                <img
                  src={item.url}
                  alt={item.personName}
                  className="w-100 h-100 object-fit-cover rounded-lg group-hover-scale transition-transform"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/200?text=Face+Photo'
                  }}
                />
                <div className="position-absolute bottom-0 left-0 right-0 p-2 bg-dark-75 text-white d-flex align-items-center justify-content-between">
                  <span className="font-bold text-xs">{item.personName}</span>
                  <Badge variant="info">{item.relationship}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* High-res Image Preview Modal */}
      <Modal
        isOpen={!!previewPhoto}
        onClose={() => setPreviewPhoto(null)}
        title={previewPhoto ? `Reference Photo: ${previewPhoto.personName}` : ''}
      >
        {previewPhoto && (
          <div className="text-center">
            <div className="bg-dark p-2 rounded-lg mb-3">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.personName}
                className="max-h-450 w-auto max-w-full rounded-lg object-fit-contain mx-auto"
              />
            </div>
            <div className="d-flex align-items-center justify-content-between text-xs text-muted">
              <span>Person: <strong>{previewPhoto.personName}</strong></span>
              <span>Relationship: <strong>{previewPhoto.relationship}</strong></span>
              <span>Filename: <code>{previewPhoto.filename}</code></span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
