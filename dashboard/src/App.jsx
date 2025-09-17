import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ClinicAnalyticsDashboard from './components/ClinicAnalyticsDashboard'
import DatabaseViewer from './components/DatabaseViewer'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ClinicAnalyticsDashboard />} />
        <Route path="/database" element={<DatabaseViewer />} />
      </Routes>
    </Router>
  )
}

export default App
