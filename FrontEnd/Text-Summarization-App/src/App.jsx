// FrontEnd/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import MainLayout from './components/Layout/MainLayout'
import DocumentList from './components/Documents/DocumentList'
import DocumentUpload from './components/Documents/DocumentUpload'
import TextSummarizer from './components/Summarization/TextSummarizer'
import SummaryHistory from './components/Summarization/SummaryHistory'
import DocumentViewer from './components/Documents/DocumentViewer'

function App() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
      
      <Route path="/" element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" />}>
        <Route index element={<TextSummarizer />} />
        <Route path="documents" element={<DocumentList />} />
        <Route path="documents/upload" element={<DocumentUpload />} />
        <Route path="documents/:id" element={<DocumentViewer />} />
        <Route path="history" element={<SummaryHistory />} />
      </Route>
    </Routes>
  )
}

export default App