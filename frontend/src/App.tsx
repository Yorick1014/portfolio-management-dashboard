import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { AppLayout } from './components/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { InvestmentsPage } from './pages/InvestmentsPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { TransactionsPage } from './pages/TransactionsPage'
import { ProtectedRoute } from './routes/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<LoginPage />} path="/login" />
          <Route element={<RegisterPage />} path="/register" />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route element={<Navigate replace to="/dashboard" />} index />
              <Route element={<DashboardPage />} path="/dashboard" />
              <Route element={<InvestmentsPage />} path="/investments" />
              <Route element={<TransactionsPage />} path="/transactions" />
            </Route>
          </Route>
          <Route element={<Navigate replace to="/dashboard" />} path="*" />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
