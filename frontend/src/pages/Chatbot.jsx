import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, Bot, User, Sparkles, AlertCircle, RefreshCw, CheckCircle2, HeartHandshake } from 'lucide-react'
import { usePatient } from '../context/PatientContext'
import { sendChatMessage, getChatbotStatus, triggerAutoGreet } from '../api/chatbot'
import Badge from '../components/Common/Badge'

export default function Chatbot() {
  const { selectedPatient, sessionPersonIds, clearSessionPersons } = usePatient()

  // Chat state
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Ollama status state
  const [ollamaStatus, setOllamaStatus] = useState({ online: false, model: '', loading: true })

  const messagesEndRef = useRef(null)

  // Fetch Ollama status on patient selection
  useEffect(() => {
    if (selectedPatient) {
      checkStatus()
      // Default welcome message
      setMessages([
        {
          sender: 'bot',
          text: `Hello ${selectedPatient.full_name}! I am your AI Memory Companion. I am here to help remind you of your loved ones, your favorite activities, or just to chat. What's on your mind today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    }
  }, [selectedPatient])

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const checkStatus = async () => {
    if (!selectedPatient) return
    setOllamaStatus({ online: false, model: '', loading: true })
    try {
      const res = await getChatbotStatus(selectedPatient.id)
      setOllamaStatus({
        online: res.ollama_available || false,
        model: res.configured_model || 'llama3.2',
        loading: false,
      })
    } catch (err) {
      setOllamaStatus({ online: false, model: '', loading: false })
    }
  }

  const handleSend = async (e) => {
    if (e) e.preventDefault()
    if (!input.trim() || !selectedPatient || loading) return

    const userText = input.trim()
    const userMsg = {
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setError('')

    try {
      // Build conversation history payload from existing messages
      const historyPayload = messages
        .filter((m) => m.sender === 'user' || m.sender === 'bot')
        .slice(-10)
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        }))

      const chatPayload = {
        message: userText,
        session_person_ids: sessionPersonIds,
        conversation_history: historyPayload,
      }

      const response = await sendChatMessage(selectedPatient.id, chatPayload)

      const botMsg = {
        sender: 'bot',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        contextUsed: response.context_used,
      }

      setMessages((prev) => [...prev, botMsg])
    } catch (err) {
      setError(err.response?.data?.detail || 'Chatbot service error. Please make sure Ollama is running.')
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `I'm having a little trouble connecting right now, but please know you are safe and cared for. (Ollama service may be starting up)`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleTriggerAutoGreet = async (personId) => {
    if (!selectedPatient || loading) return
    setLoading(true)
    try {
      const res = await triggerAutoGreet(selectedPatient.id, personId)
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: res.greeting,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAutoGreet: true,
        },
      ])
    } catch (err) {
      setError('Auto-greet failed')
    } finally {
      setLoading(false)
    }
  }

  const quickPrompts = [
    "Who visited me today?",
    "Tell me about my family",
    "What are my favorite hobbies?",
    "I feel a bit confused right now",
  ]

  return (
    <div className="container py-4 d-flex flex-column" style={{ minHeight: 'calc(100vh - 100px)' }}>
      {/* Header & Status Bar */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-3 gap-2">
        <div>
          <h1 className="h3 mb-1 font-bold d-flex align-items-center gap-2">
            <MessageSquare className="text-success" size={28} />
            AI Memory Companion
          </h1>
          <p className="text-secondary text-sm mb-0">
            Compassionate assistant with patient context & real-time visitor memory
          </p>
        </div>

        {/* Ollama status badge */}
        <div className="d-flex align-items-center gap-2">
          {ollamaStatus.loading ? (
            <span className="badge bg-secondary p-2 text-xs">
              <span className="spinner-border spinner-border-sm me-1"></span> Checking AI status...
            </span>
          ) : ollamaStatus.online ? (
            <span className="badge bg-success-subtle text-success p-2 text-xs border border-success d-flex align-items-center gap-1">
              <CheckCircle2 size={14} /> Ollama AI Online ({ollamaStatus.model})
            </span>
          ) : (
            <button
              onClick={checkStatus}
              className="btn btn-outline-warning btn-sm text-xs d-flex align-items-center gap-1"
            >
              <RefreshCw size={12} /> Ollama Offline (Retry)
            </button>
          )}
        </div>
      </div>

      {!selectedPatient ? (
        <div className="alert alert-warning d-flex align-items-center gap-2">
          <AlertCircle size={20} />
          <span>Please select a patient to launch the companion chatbot.</span>
        </div>
      ) : (
        <div className="card glass-panel flex-grow-1 d-flex flex-column p-3 position-relative overflow-hidden">
          {/* Active Session Context Banner (if camera recognized people) */}
          {sessionPersonIds.length > 0 && (
            <div className="p-2 mb-3 bg-secondary-subtle border-glow rounded-lg d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2 text-xs">
                <Sparkles size={16} className="text-warning" />
                <span>Camera recognized <strong>{sessionPersonIds.length}</strong> visitor(s) in active session context</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                {sessionPersonIds.map((pId) => (
                  <button
                    key={pId}
                    onClick={() => handleTriggerAutoGreet(pId)}
                    className="btn btn-success btn-xs py-0 px-2 text-xs"
                    title="Trigger Auto-Greet"
                  >
                    <HeartHandshake size={12} className="me-1" /> Auto-Greet
                  </button>
                ))}
                <button onClick={clearSessionPersons} className="btn btn-secondary btn-xs py-0 px-2 text-xs">
                  Clear Session
                </button>
              </div>
            </div>
          )}

          {/* Messages Container */}
          <div className="chat-messages flex-grow-1 overflow-auto p-2 mb-3" style={{ maxHeight: '520px' }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`d-flex mb-3 ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
              >
                <div className={`d-flex gap-2 max-w-lg ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div
                    className={`p-2 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${
                      msg.sender === 'user' ? 'bg-primary text-white' : 'bg-success-subtle text-success'
                    }`}
                    style={{ width: '36px', height: '36px' }}
                  >
                    {msg.sender === 'user' ? <User size={18} /> : <Bot size={18} />}
                  </div>

                  <div>
                    <div
                      className={`p-3 rounded-lg text-sm ${
                        msg.sender === 'user'
                          ? 'bg-primary text-white'
                          : msg.isError
                          ? 'bg-danger-subtle text-danger border border-danger'
                          : 'bg-secondary border-glow'
                      }`}
                    >
                      {msg.text}
                    </div>

                    <div className="d-flex align-items-center gap-2 mt-1 px-1 text-xs text-muted">
                      <span>{msg.timestamp}</span>
                      {msg.contextUsed?.has_historical_context && (
                        <Badge variant="info">Memory Injected</Badge>
                      )}
                      {msg.isAutoGreet && (
                        <Badge variant="success">Auto-Greet</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="d-flex justify-content-start mb-3">
                <div className="d-flex gap-2">
                  <div className="p-2 rounded-circle bg-success-subtle text-success" style={{ width: '36px', height: '36px' }}>
                    <Bot size={18} />
                  </div>
                  <div className="p-3 bg-secondary rounded-lg text-xs text-secondary d-flex align-items-center gap-2">
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    <span>Thinking with care...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="d-flex flex-wrap gap-2 mb-3">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInput(prompt)
                }}
                className="btn btn-secondary btn-sm text-xs rounded-pill"
              >
                "{prompt}"
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="d-flex gap-2">
            <input
              type="text"
              className="form-control text-sm py-2"
              placeholder="Ask a question or type a message to your companion..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="btn btn-success px-4" disabled={loading || !input.trim()}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
