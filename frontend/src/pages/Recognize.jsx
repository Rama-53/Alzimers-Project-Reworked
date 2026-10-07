import React, { useState, useRef, useEffect } from 'react'
import { Camera, Upload, AlertCircle, RefreshCw, CheckCircle2, User, Sparkles, Sliders, Shield } from 'lucide-react'
import { usePatient } from '../context/PatientContext'
import { recognizeImage } from '../api/recognition'
import Badge from '../components/Common/Badge'

export default function Recognize() {
  const { selectedPatient, addSessionPersonId } = usePatient()
  const [activeTab, setActiveTab] = useState('camera') // 'camera' | 'upload'

  // Webcam state
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Upload state
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [tolerance, setTolerance] = useState(0.6)

  // Results state
  const [recognitionResults, setRecognitionResults] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  // Start webcam on mount if active tab is camera
  useEffect(() => {
    if (activeTab === 'camera' && selectedPatient) {
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [activeTab, selectedPatient])

  const startCamera = async () => {
    setCameraError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsStreaming(true)
      }
    } catch (err) {
      setCameraError('Unable to access camera. Please check camera permissions or use Photo Upload.')
      setIsStreaming(false)
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setIsStreaming(false)
  }

  // Capture frame from webcam and send for recognition
  const captureAndRecognize = async () => {
    if (!selectedPatient || !videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(async (blob) => {
      if (!blob) return
      const file = new File([blob], 'webcam_capture.jpg', { type: 'image/jpeg' })
      await processRecognition(file)
    }, 'image/jpeg', 0.9)
  }

  // Handle file upload input change
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setRecognitionResults(null)
      setErrorMsg('')
    }
  }

  // Trigger recognition API call
  const processRecognition = async (fileToRecognize) => {
    if (!selectedPatient) return
    setIsAnalyzing(true)
    setErrorMsg('')
    try {
      const file = fileToRecognize || selectedFile
      if (!file) {
        setErrorMsg('Please select or capture an image first.')
        setIsAnalyzing(false)
        return
      }

      const res = await recognizeImage(selectedPatient.id, file, tolerance)
      setRecognitionResults(res)

      // Add recognized persons to active chatbot session context
      if (res.results && res.results.length > 0) {
        res.results.forEach((match) => {
          if (match.match_found && match.person_id) {
            addSessionPersonId(match.person_id)
          }
        })
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Recognition failed. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="container py-4">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div>
          <h1 className="h3 mb-1 font-bold d-flex align-items-center gap-2">
            <Camera className="text-primary" size={28} />
            Face Recognition System
          </h1>
          <p className="text-secondary text-sm mb-0">
            Real-time video detection & memory retrieval powered by ArcFace AI
          </p>
        </div>

        {/* Tab switcher */}
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
        <div className="alert alert-warning d-flex align-items-center gap-2 mb-4">
          <AlertCircle size={20} />
          <span>Please select or add a patient using the top dropdown before initiating recognition.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left 2 Columns: Video Feed / Photo Canvas */}
          <div className="lg:col-span-2">
            <div className="card glass-panel p-3 position-relative">
              {/* Tolerance controls */}
              <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                <div className="d-flex align-items-center gap-2 text-xs text-secondary font-bold">
                  <Sliders size={16} /> Distance Threshold (Tolerance): {tolerance}
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="0.8"
                  step="0.05"
                  value={tolerance}
                  onChange={(e) => setTolerance(parseFloat(e.target.value))}
                  className="form-range"
                  style={{ width: '140px' }}
                />
              </div>

              {/* Camera View Mode */}
              {activeTab === 'camera' && (
                <div className="position-relative bg-dark rounded-lg overflow-hidden d-flex align-items-center justify-content-center" style={{ minHeight: '380px' }}>
                  {cameraError ? (
                    <div className="p-4 text-center text-danger">
                      <AlertCircle size={36} className="mb-2 mx-auto" />
                      <p className="mb-0 text-sm">{cameraError}</p>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-100 h-100 object-fit-cover rounded-lg"
                      />
                      <canvas ref={canvasRef} className="d-none" />

                      {/* Live scanning badge overlay */}
                      <div className="position-absolute top-3 left-3 bg-dark-75 px-3 py-1 rounded-pill text-xs d-flex align-items-center gap-2 border border-glow">
                        <span className="pulse-dot bg-success"></span> Live Feed Active
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Upload View Mode */}
              {activeTab === 'upload' && (
                <div className="position-relative bg-dark rounded-lg overflow-hidden d-flex align-items-center justify-content-center p-4" style={{ minHeight: '380px' }}>
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Recognition Upload Preview"
                      className="max-h-350 max-w-full rounded-lg object-fit-contain"
                    />
                  ) : (
                    <label className="d-flex flex-column align-items-center justify-content-center cursor-pointer p-5 border-dashed rounded-lg text-center w-100">
                      <Upload size={48} className="text-secondary mb-3" />
                      <span className="font-bold text-sm text-primary mb-1">Click or drag a image photo here</span>
                      <span className="text-xs text-muted">Supports JPG, PNG, WEBP</span>
                      <input type="file" accept="image/*" className="d-none" onChange={handleFileChange} />
                    </label>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="d-flex align-items-center justify-content-between mt-3">
                {activeTab === 'upload' && (
                  <label className="btn btn-secondary text-sm">
                    Choose Different Image
                    <input type="file" accept="image/*" className="d-none" onChange={handleFileChange} />
                  </label>
                )}

                {activeTab === 'camera' && (
                  <button
                    onClick={startCamera}
                    className="btn btn-secondary text-sm d-flex align-items-center gap-1"
                    title="Restart Camera"
                  >
                    <RefreshCw size={16} /> Restart Feed
                  </button>
                )}

                <button
                  onClick={activeTab === 'camera' ? captureAndRecognize : () => processRecognition()}
                  disabled={isAnalyzing || (activeTab === 'upload' && !selectedFile)}
                  className="btn btn-primary d-flex align-items-center gap-2 ms-auto"
                >
                  {isAnalyzing ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      Scanning Faces...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      {activeTab === 'camera' ? 'Scan & Recognize Face' : 'Analyze Photo'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Recognition Result Panel */}
          <div>
            <div className="card glass-panel p-4 h-100">
              <h2 className="h5 font-bold mb-3 d-flex align-items-center gap-2">
                <Shield className="text-primary" size={20} />
                Recognition Results
              </h2>

              {errorMsg && (
                <div className="alert alert-danger text-sm mb-3">{errorMsg}</div>
              )}

              {!recognitionResults && !errorMsg && !isAnalyzing && (
                <div className="text-center py-5 text-muted">
                  <User size={48} className="mb-2 opacity-50 mx-auto" />
                  <p className="text-sm mb-0">
                    No face scan performed yet. Capture a frame or upload a photo to identify visitors.
                  </p>
                </div>
              )}

              {isAnalyzing && (
                <div className="text-center py-5 text-primary">
                  <div className="spinner-border mb-3" role="status"></div>
                  <p className="font-bold text-sm mb-0">Running ArcFace Neural Model...</p>
                  <p className="text-xs text-muted">Matching feature embeddings against database</p>
                </div>
              )}

              {recognitionResults && (
                <div>
                  <div className="text-xs text-muted mb-3 pb-2 border-bottom d-flex justify-content-between">
                    <span>Detected Faces: <strong>{recognitionResults.faces_detected}</strong></span>
                    <span>Matches: <strong>{recognitionResults.matches_found}</strong></span>
                  </div>

                  {recognitionResults.results?.length === 0 ? (
                    <div className="alert alert-warning text-sm mb-0">
                      No faces detected in the image. Please try a clearer front-facing photo.
                    </div>
                  ) : (
                    recognitionResults.results?.map((res, idx) => (
                      <div key={idx} className="card bg-secondary p-3 mb-3 border-glow">
                        {res.match_found ? (
                          <>
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <span className="font-bold text-lg text-primary">{res.person_name}</span>
                              <Badge variant="success">
                                {Math.round((1 - res.distance) * 100)}% Match
                              </Badge>
                            </div>

                            <div className="mb-2">
                              <Badge variant="info">{res.relationship}</Badge>
                            </div>

                            {res.key_memories && (
                              <div className="p-2 bg-dark rounded text-xs mb-2">
                                <strong className="text-warning">Key Memories:</strong>
                                <p className="mb-0 text-secondary mt-1">{res.key_memories}</p>
                              </div>
                            )}

                            {res.conversation_hints && (
                              <div className="p-2 bg-dark rounded text-xs">
                                <strong className="text-info">Chat Hints:</strong>
                                <p className="mb-0 text-secondary mt-1">{res.conversation_hints}</p>
                              </div>
                            )}

                            <div className="mt-2 text-xs text-success font-bold d-flex align-items-center gap-1">
                              <CheckCircle2 size={14} /> Added to active AI Chat context
                            </div>
                          </>
                        ) : (
                          <div>
                            <div className="d-flex align-items-center justify-content-between mb-1">
                              <span className="font-bold text-danger">Unknown Person</span>
                              <Badge variant="warning">Unrecognized</Badge>
                            </div>
                            <p className="text-xs text-muted mb-0">
                              Face detected but similarity threshold was not met. Register this person in "Manage People" to recognize them next time.
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
