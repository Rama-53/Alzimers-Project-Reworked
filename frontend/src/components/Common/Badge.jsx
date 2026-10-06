import React from 'react'

export default function Badge({ variant = 'info', children }) {
  const badgeClass = `badge badge-${variant}`
  return <span className={badgeClass}>{children}</span>
}
