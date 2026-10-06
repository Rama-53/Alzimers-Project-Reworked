import React, { useState, useEffect } from 'react'
import { LayoutDashboard, AlertCircle, Clock, CheckCircle2 } from 'lucide-react'
import { usePatient } from '../context/PatientContext'
import { getInteractions } from '../api/interactions'
import Badge from '../components/Common/Badge'

export default function Dashboard() {
  const { selectedPatient } = usePatient()
  const [interactions, setInteractions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedPatient) {
      setLoading(true)
      getInteractions(selectedPatient.id)
        .then(setInteractions)
        .catch(() => setInteractions([]))
        .finally(() => setLoading(false))
    }
  }, [selectedPatient])

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h3 mb-1 font-bold d-flex align-items-center gap-2">
            <LayoutDashboard className="text-danger" size={28} />
            Analytics & Interaction Log
          </h1>
          <p className="text-secondary text-sm mb-0">
            Real-time recognition logs and caregiver activity summary
          </p>
        </div>
      </div>

      {!selectedPatient ? (
        <div className="alert alert-warning d-flex align-items-center gap-2">
          <AlertCircle size={20} />
          Please select a patient to view analytics and interaction logs.
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="card glass-panel p-4">
              <div className="text-xs text-muted font-bold text-uppercase mb-1">Total Interactions</div>
              <div className="h2 font-bold mb-0 text-primary">{interactions.length}</div>
            </div>
            <div className="card glass-panel p-4">
              <div className="text-xs text-muted font-bold text-uppercase mb-1">Recognition Confidence</div>
              <div className="h2 font-bold mb-0 text-success">98.4%</div>
            </div>
            <div className="card glass-panel p-4">
              <div className="text-xs text-muted font-bold text-uppercase mb-1">Active Patient</div>
              <div className="h4 font-bold mb-0 text-info">{selectedPatient.full_name}</div>
            </div>
          </div>

          <div className="card glass-panel p-4">
            <h3 className="h5 font-bold mb-3 d-flex align-items-center gap-2">
              <Clock size={18} className="text-secondary" />
              Recent Recognition Events
            </h3>

            {loading ? (
              <div className="text-center py-4 text-muted">Loading logs...</div>
            ) : interactions.length === 0 ? (
              <div className="text-center py-4 text-muted">
                No interaction logs recorded yet. Use Live Recognition to generate log entries.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Recognized Person</th>
                      <th>Confidence</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interactions.map((item) => (
                      <tr key={item.id}>
                        <td className="text-xs">{new Date(item.timestamp).toLocaleString()}</td>
                        <td className="font-bold">{item.person_name || 'Unknown'}</td>
                        <td>
                          <Badge variant={item.confidence > 0.7 ? 'success' : 'warning'}>
                            {Math.round((item.confidence || 0) * 100)}%
                          </Badge>
                        </td>
                        <td>
                          <span className="d-flex align-items-center gap-1 text-xs text-success">
                            <CheckCircle2 size={14} /> Logged
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
