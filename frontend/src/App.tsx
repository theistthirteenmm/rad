import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store/useStore'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import FarsiGamesPage from './pages/FarsiGamesPage'
import MathGamesPage from './pages/MathGamesPage'
import ScienceGamesPage from './pages/ScienceGamesPage'
import QuranGamesPage from './pages/QuranGamesPage'
import WritingGamesPage from './pages/WritingGamesPage'
import DashboardPage from './pages/DashboardPage'
import CharacterPage from './pages/CharacterPage'
import TeacherDashboard from './pages/TeacherDashboard'
import ParentDashboard from './pages/ParentDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AboutPage from './pages/AboutPage'
import LeaderboardPage from './pages/LeaderboardPage'
import LearningHubPage from './pages/LearningHubPage'
import SuperAdminPage from './pages/SuperAdminPage'

function Guard({ children, role }: { children: JSX.Element; role?: string }) {
  const user = useStore(s => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) {
    if (user.role === 'admin') return <Navigate to={user.username === 'hamed' ? '/superadmin' : '/admin'} replace />
    if (user.role === 'teacher') return <Navigate to="/teacher" replace />
    if (user.role === 'parent') return <Navigate to="/parent" replace />
    return <Navigate to="/" replace />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/leaderboard" element={<Guard><LeaderboardPage /></Guard>} />
        <Route path="/superadmin" element={<Guard role="admin"><SuperAdminPage /></Guard>} />
        <Route path="/admin" element={<Guard role="admin"><AdminDashboard /></Guard>} />
        <Route path="/teacher" element={<Guard role="teacher"><TeacherDashboard /></Guard>} />
        <Route path="/parent" element={<Guard role="parent"><ParentDashboard /></Guard>} />
        <Route path="/" element={<Guard role="student"><HomePage /></Guard>} />
        <Route path="/farsi" element={<Guard role="student"><FarsiGamesPage /></Guard>} />
        <Route path="/math" element={<Guard role="student"><MathGamesPage /></Guard>} />
        <Route path="/science" element={<Guard role="student"><ScienceGamesPage /></Guard>} />
        <Route path="/quran" element={<Guard role="student"><QuranGamesPage /></Guard>} />
        <Route path="/writing" element={<Guard role="student"><WritingGamesPage /></Guard>} />
        <Route path="/dashboard" element={<Guard role="student"><DashboardPage /></Guard>} />
        <Route path="/character" element={<Guard role="student"><CharacterPage /></Guard>} />
        <Route path="/learn" element={<Guard role="student"><LearningHubPage /></Guard>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
