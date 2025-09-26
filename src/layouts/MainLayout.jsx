import { useState } from 'react'
import Sidebar from '../components/Sidebar'

function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div>
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <main 
        className="p-6 bg-gray-100 min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? '16rem' : '4rem' }}
      >
        {children} {/* This is where your pages render */}
      </main>
    </div>
  )
}

export default MainLayout