import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import DriverPortal from './pages/DriverPortal.jsx'

export default function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="dark"
        toastStyle={{ background: '#0a1020', border: '1px solid #1a2540', color: '#e2e8f0' }}
      />
      <Routes>
        <Route path="/Mobile-ICU-Dispatch" element={<DriverPortal />} />
        <Route path="*" element={<Navigate to="/Mobile-ICU-Dispatch" replace />} />
      </Routes>
    </>
  )
}
