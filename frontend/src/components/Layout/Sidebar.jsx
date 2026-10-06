import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Camera, MessageSquare, Users, Image, LayoutDashboard } from 'lucide-react'

export default function Sidebar({ isOpen, onClose }) {
  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/recognize', label: 'Face Recognition', icon: Camera },
    { path: '/chatbot', label: 'AI Companion', icon: MessageSquare },
    { path: '/people', label: 'Manage People', icon: Users },
    { path: '/gallery', label: 'Photo Gallery', icon: Image },
    { path: '/dashboard', label: 'Analytics Dashboard', icon: LayoutDashboard },
  ]

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="modal-backdrop d-md-none"
          onClick={onClose}
          style={{ zIndex: 1040 }}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'show' : ''}`}>
        <nav className="nav-menu">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
