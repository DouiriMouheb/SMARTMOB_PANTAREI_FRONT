import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import MainLayout from './layouts/MainLayout'
import Acquisizioni from './pages/Acquisizioni'
import Postazioni from './pages/Postazioni'

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Acquisizioni />} />
          <Route path="/acquisizioni" element={<Acquisizioni />} />
          <Route path="/postazioni" element={<Postazioni />} />
        </Routes>
      </MainLayout>
      <Toaster position="top-right" />
    </Router>
  )
}

export default App
