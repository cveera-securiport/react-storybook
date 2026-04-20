import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { LoginPage, Dashboard } from '@ibc/ui'

function LoginRoute() {
  const navigate = useNavigate()

  return (
    <LoginPage
      onLogin={(email, password) => {
        console.log('Login:', email, password)
        navigate('/dashboard')
      }}
      onForgotPassword={() => console.log('Forgot password')}
      onSignUp={() => console.log('Sign up')}
    />
  )
}

function DashboardRoute() {
  const navigate = useNavigate()

  return (
    <Dashboard
      onNavigate={(href) => navigate(href)}
    />
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/dashboard" element={<DashboardRoute />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
