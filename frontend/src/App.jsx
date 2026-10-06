import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Home from './pages/Home'
import Recognize from './pages/Recognize'
import Chatbot from './pages/Chatbot'
import ManagePeople from './pages/ManagePeople'
import Gallery from './pages/Gallery'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/recognize" element={<Recognize />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/people" element={<ManagePeople />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Layout>
  )
}

export default App
