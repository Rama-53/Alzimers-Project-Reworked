import React from 'react'
import { Link } from 'react-router-dom'
import { Camera, MessageSquare, Users, Image, ShieldCheck, Heart, Sparkles, UserPlus } from 'lucide-react'
import { usePatient } from '../context/PatientContext'
import Badge from '../components/Common/Badge'

export default function Home() {
  const { selectedPatient, loading } = usePatient()

  return (
    <div className="container py-4">
      {/* Hero Welcome Banner */}
      <div className="card glass-panel mb-4 p-4 position-relative overflow-hidden">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <Sparkles className="text-warning" size={24} />
              <h1 className="h2 mb-0">Welcome to Alzheimer Helper</h1>
            </div>
            <p className="text-secondary text-sm mb-0">
              AI-Assisted Memory Companion & Real-Time Facial Recognition for Caregivers and Loved Ones.
            </p>
          </div>

          {selectedPatient && (
            <div className="card bg-secondary p-3 border-glow min-w-200">
              <div className="text-xs text-muted font-bold text-uppercase mb-1">Active Patient</div>
              <div className="font-bold text-lg d-flex align-items-center gap-2">
                <Heart className="text-danger" size={18} />
                {selectedPatient.full_name}
              </div>
              <div className="mt-1">
                <Badge variant="primary">{selectedPatient.stage} Stage</Badge>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <h2 className="h4 mb-3 font-bold text-secondary">Quick Actions & Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
        <Link to="/recognize" className="card card-hover p-4 text-decoration-none">
          <div className="d-flex align-items-center gap-3 mb-3">
            <div className="p-3 bg-primary-subtle text-primary rounded-lg">
              <Camera size={28} />
            </div>
            <div>
              <h3 className="h5 mb-0 text-primary font-bold">Face Recognition</h3>
              <span className="text-xs text-muted">Live Camera & Photo Scan</span>
            </div>
          </div>
          <p className="text-sm text-secondary mb-0">
            Identify visitors in real time via live webcam feed or uploaded photos. Displays names, relationships, and memory prompts instantly.
          </p>
        </Link>

        <Link to="/chatbot" className="card card-hover p-4 text-decoration-none">
          <div className="d-flex align-items-center gap-3 mb-3">
            <div className="p-3 bg-success-subtle text-success rounded-lg">
              <MessageSquare size={28} />
            </div>
            <div>
              <h3 className="h5 mb-0 text-success font-bold">AI Companion</h3>
              <span className="text-xs text-muted">Ollama Memory Chatbot</span>
            </div>
          </div>
          <p className="text-sm text-secondary mb-0">
            Gentle, patient conversational partner powered by Ollama AI. Injects memory prompts, recent encounters, and auto-greets recognized persons.
          </p>
        </Link>

        <Link to="/people" className="card card-hover p-4 text-decoration-none">
          <div className="d-flex align-items-center gap-3 mb-3">
            <div className="p-3 bg-info-subtle text-info rounded-lg">
              <Users size={28} />
            </div>
            <div>
              <h3 className="h5 mb-0 text-info font-bold">Manage People</h3>
              <span className="text-xs text-muted">Known Individuals & Embeddings</span>
            </div>
          </div>
          <p className="text-sm text-secondary mb-0">
            Register family members, caregivers, and friends with facial photos, relationships, key memories, and custom conversational hints.
          </p>
        </Link>

        <Link to="/gallery" className="card card-hover p-4 text-decoration-none">
          <div className="d-flex align-items-center gap-3 mb-3">
            <div className="p-3 bg-warning-subtle text-warning rounded-lg">
              <Image size={28} />
            </div>
            <div>
              <h3 className="h5 mb-0 text-warning font-bold">Photo Gallery</h3>
              <span className="text-xs text-muted">Memory Albums & Snapshots</span>
            </div>
          </div>
          <p className="text-sm text-secondary mb-0">
            Explore stored photo collections for every registered person. Add new angles and reference images for higher recognition accuracy.
          </p>
        </Link>

        <Link to="/dashboard" className="card card-hover p-4 text-decoration-none">
          <div className="d-flex align-items-center gap-3 mb-3">
            <div className="p-3 bg-danger-subtle text-danger rounded-lg">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h3 className="h5 mb-0 text-danger font-bold">Analytics & Logs</h3>
              <span className="text-xs text-muted">Interaction Timeline</span>
            </div>
          </div>
          <p className="text-sm text-secondary mb-0">
            Review detailed timelines of recognition events, visitor frequency, system activity, and safety metrics for caregivers.
          </p>
        </Link>

        <div className="card glass-panel p-4 d-flex flex-column justify-content-between">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <UserPlus className="text-primary" size={22} />
              <h3 className="h5 mb-0 font-bold">Patient Profile</h3>
            </div>
            <p className="text-sm text-secondary mb-3">
              Currently active patient: <strong>{selectedPatient ? selectedPatient.full_name : 'None Selected'}</strong>
            </p>
            {selectedPatient?.notes && (
              <div className="p-2 bg-secondary rounded text-xs text-muted mb-3">
                "{selectedPatient.notes}"
              </div>
            )}
          </div>
          <div className="text-xs text-muted">
            Tip: Use the patient selector in the top navbar to switch between profiles.
          </div>
        </div>
      </div>
    </div>
  )
}
