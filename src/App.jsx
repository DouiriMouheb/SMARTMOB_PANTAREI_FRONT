import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from './components/ErrorBoundary'
import MainLayout from './layouts/MainLayout'
import Acquisizioni from './pages/Acquisizioni'
import Postazioni from './pages/Postazioni'
import RealTimeMonitoring from './pages/RealTimeMonitoring'

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Acquisizioni />} />
            <Route path="/acquisizioni" element={<Acquisizioni />} />
            <Route path="/postazioni" element={<Postazioni />} />
            <Route path="/realtime-monitoring" element={<RealTimeMonitoring />} />
          </Routes>
        </MainLayout>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffffff',
              color: '#1a1919ff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4ade80',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </Router>
    </ErrorBoundary>
  )
}

export default App
