import React, { useState } from 'react'
import { Camera, Upload, AlertCircle, Sparkles } from 'lucide-react'
import { usePatient } from '../context/PatientContext'

export default function Recognize() {
  const { selectedPatient } = usePatient()
  const [activeTab, setActiveTab] = useState('camera')

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h3 mb-1 font-bold d-flex align-items-center gap-2">
            <Camera className="text-primary" size={28} />
            Face Recognition
          </h1>
          <p className="text-secondary text-sm mb-0">
            Real-time video stream analysis & static image recognition
          </p>
        </div>

        <div className="btn-group">
          <button
            className={`btn ${activeTab === 'camera' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('camera')}
          >
            <Camera size={16} className="me-2" /> Live Camera
          </button>
          <button
            className={`btn ${activeTab === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload size={16} className="me-2" /> Photo Upload
          </button>
        </div>
      </div>

      {!selectedPatient ? (
        <div className="alert alert-warning d-flex align-items-center gap-2">
          <AlertCircle size={20} />
          Please select or create a patient to use face recognition.
        </div>
      ) : (
        <div className="card glass-panel p-4 text-center py-5">
          <Sparkles size={48} className="text-primary mx-auto mb-3" />
          <h3 className="h4 font-bold mb-2">Face Recognition Module Ready</h3>
          <p className="text-secondary text-sm max-w-md mx-auto mb-4">
            Active patient: <strong>{selectedPatient.full_name}</strong>. WebRTC camera feed and WebSocket streaming will be connected in Phase 5.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <button className="btn btn-primary" onClick={() => alert('Phase 5 recognition feature coming up next!')}>
              Test Connection
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
