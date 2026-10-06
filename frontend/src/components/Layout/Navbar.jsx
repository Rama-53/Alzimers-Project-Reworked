import React from 'react'
import { Menu, HeartPulse } from 'lucide-react'
import ThemeToggle from '../Common/ThemeToggle'
import PatientSelector from '../Common/PatientSelector'

export default function Navbar({ onToggleSidebar, onOpenAddPatientModal }) {
  return (
    <header className="navbar">
      <div className="d-flex align-items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="btn btn-secondary p-2 d-md-none"
          aria-label="Toggle Sidebar"
        >
          <Menu size={20} />
        </button>

        <div className="d-flex align-items-center gap-2">
          <HeartPulse size={24} className="text-primary" />
          <span className="font-bold text-lg text-glow" style={{ letterSpacing: '-0.5px' }}>
            Alzheimer Helper
          </span>
        </div>
      </div>

      <div className="d-flex align-items-center gap-3">
        <PatientSelector onOpenAddModal={onOpenAddPatientModal} />
        <ThemeToggle />
      </div>
    </header>
  )
}
