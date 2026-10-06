import React, { useState } from 'react'
import { MessageSquare, Send, Bot, AlertCircle } from 'lucide-react'
import { usePatient } from '../context/PatientContext'

export default function Chatbot() {
  const { selectedPatient } = usePatient()
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Hello! I am your AI memory assistant. How can I help you today?`,
    },
  ])
  const [input, setInput] = useState('')

  const handleSend = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    setMessages((prev) => [...prev, { sender: 'user', text: input }])
    setInput('')
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `I understand. I am here with you. (Phase 6 full Ollama stream integration will connect live conversations!)`,
        },
      ])
    }, 600)
  }

  return (
    <div className="container py-4" style={{ height: 'calc(100vh - 100px)' }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h1 className="h3 mb-1 font-bold d-flex align-items-center gap-2">
            <MessageSquare className="text-success" size={28} />
            AI Companion
          </h1>
          <p className="text-secondary text-sm mb-0">
            Compassionate, context-aware chatbot powered by Ollama
          </p>
        </div>
      </div>

      {!selectedPatient ? (
        <div className="alert alert-warning d-flex align-items-center gap-2">
          <AlertCircle size={20} />
          Please select a patient to start the AI Companion chat session.
        </div>
      ) : (
        <div className="card glass-panel h-100 d-flex flex-column p-3">
          <div className="chat-messages flex-grow-1 overflow-auto mb-3 p-2">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`d-flex mb-3 ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
              >
                <div
                  className={`p-3 rounded-lg max-w-md ${
                    msg.sender === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-secondary border-glow'
                  }`}
                >
                  {msg.sender === 'bot' && (
                    <div className="d-flex align-items-center gap-2 text-xs font-bold text-success mb-1">
                      <Bot size={16} /> AI Memory Assistant
                    </div>
                  )}
                  <p className="mb-0 text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="d-flex gap-2">
            <input
              type="text"
              className="form-control"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="btn btn-success">
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
