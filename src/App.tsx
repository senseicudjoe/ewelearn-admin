import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './pages/auth/LoginPage'
import { Toaster} from sonner

function App() {
  return (
    
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster richColors position="top-center"/>
    </>
  )
}

export default App
