import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import { PatientProvider } from './context/PatientContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <PatientProvider>
          <App />
        </PatientProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
