import React, { useState, useEffect } from 'react'
import { LayoutDashboard, AlertCircle, Clock, CheckCircle2, RefreshCw, Users, ShieldCheck, Search, Filter } from 'lucide-react'
import { usePatient } from '../context/PatientContext'
import { getInteractions } from '../api/interactions'
import Badge from '../components/Common/Badge'

export default function Dashboard() {
  const { selectedPatient } = usePatient()

  const [interactions, setInteractions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (selectedPatient) {
      fetchLogs()
    }
  }, [selectedPatient])

  const fetchLogs = async () => {
    if (!selectedPatient) return
    setLoading(true)
    setError('')
    try {
      const data = await getInteractions(selectedPatient.id, 100)
      setInteractions(data)
    } catch (err) {
      setError('Failed to load interaction timeline.')
    } finally {
      setLoading(false)
    }
  }

  // Filter logs by search term
  const filteredInteractions = interactions.filter((item) => {
    const term = searchTerm.toLowerCase()
    const name = (item.person_name || 'Unknown').toLowerCase()
    const relationship = (item.relationship || '').toLowerCase()
    return name.includes(term) || relationship.includes(term)
  })

  // Calculate statistics metrics
  const totalInteractions = interactions.length
  const todayCount = interactions.filter((item) => {
    const itemDate = new Date(item.timestamp).toDateString()
    const today = new Date().toDateString()
    return itemDate === today
  }).length

  const uniqueVisitors = new Set(
    interactions.map((i) => i.person_id).filter(Boolean)
  ).size

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div>
          <h1 className="h3 mb-1 font-bold d-flex align-items-center gap-2">
            <LayoutDashboard className="text-danger" size={28} />
            Caregiver Analytics & Log Timeline
          </h1>
          <p className="text-secondary text-sm mb-0">
            Real-time recognition logs, visitor frequencies, and safety monitoring metrics
          </p>
        </div>

        {selectedPatient && (
          <button
            onClick={fetchLogs}
            className="btn btn-secondary text-sm d-flex align-items-center gap-2"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh Analytics
          </button>
        )}
      </div>

      {!selectedPatient ? (
        <div className="alert alert-warning d-flex align-items-center gap-2">
          <AlertCircle size={20} />
          <span>Please select a patient to view interaction analytics.</span>
        </div>
      ) : (
        <div>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="card glass-panel p-4">
              <div className="text-xs text-muted font-bold text-uppercase mb-1">Today's Visitors</div>
              <div className="h2 font-bold mb-0 text-primary">{todayCount}</div>
              <span className="text-xs text-secondary mt-1 d-block">Log events recorded today</span>
            </div>

            <div className="card glass-panel p-4">
              <div className="text-xs text-muted font-bold text-uppercase mb-1">Total Recognition Events</div>
              <div className="h2 font-bold mb-0 text-success">{totalInteractions}</div>
              <span className="text-xs text-secondary mt-1 d-block">Lifetime log entries</span>
            </div>

            <div className="card glass-panel p-4">
              <div className="text-xs text-muted font-bold text-uppercase mb-1">Unique Known Visitors</div>
              <div className="h2 font-bold mb-0 text-info">{uniqueVisitors}</div>
              <span className="text-xs text-secondary mt-1 d-block">Distinct registered persons</span>
            </div>

            <div className="card glass-panel p-4">
              <div className="text-xs text-muted font-bold text-uppercase mb-1">Model Accuracy</div>
              <div className="h2 font-bold mb-0 text-warning">ArcFace</div>
              <span className="text-xs text-secondary mt-1 d-block">Cosine similarity embedding</span>
            </div>
          </div>

          {/* Log Table Card */}
          <div className="card glass-panel p-4">
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
              <h2 className="h5 font-bold mb-0 d-flex align-items-center gap-2">
                <Clock size={18} className="text-secondary" />
                Recognition Log Timeline
              </h2>

              <div className="d-flex align-items-center gap-2">
                <div className="position-relative">
                  <Search size={16} className="position-absolute top-50 translate-middle-y ms-2 text-muted" />
                  <input
                    type="text"
                    className="form-control form-control-sm ps-4"
                    placeholder="Search by name or relationship..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '240px' }}
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-5 text-secondary">
                <div className="spinner-border mb-2" role="status"></div>
                <p className="text-sm">Fetching recognition log history...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger mb-0">{error}</div>
            ) : filteredInteractions.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <ShieldCheck size={44} className="mb-2 opacity-50 mx-auto" />
                <p className="text-sm mb-0">No matching recognition log entries found.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Recognized Person</th>
                      <th>Relationship</th>
                      <th>Match Confidence</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInteractions.map((log) => {
                      const confidence = log.confidence ? Math.round(log.confidence * 100) : 95
                      return (
                        <tr key={log.id}>
                          <td className="text-xs text-muted">
                            {new Date(log.timestamp).toLocaleString([], {
                              dateStyle: 'short',
                              timeStyle: 'medium',
                            })}
                          </td>
                          <td className="font-bold text-primary">{log.person_name || 'Unknown'}</td>
                          <td>
                            <Badge variant="info">{log.relationship || 'Visitor'}</Badge>
                          </td>
                          <td>
                            <Badge variant={confidence > 75 ? 'success' : 'warning'}>
                              {confidence}% Match
                            </Badge>
                          </td>
                          <td>
                            <span className="d-flex align-items-center gap-1 text-xs text-success">
                              <CheckCircle2 size={14} /> Logged
                            </span>
                          </td>
                        </tr>
                      )
                    })}
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
