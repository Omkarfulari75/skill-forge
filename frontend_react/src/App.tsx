import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CourseDetail from './pages/CourseDetail';
import CourseSelection from './pages/CourseSelection';
import './App.css';

const PrivateRoute = ({ children, allowedRole }: { children: React.ReactNode, allowedRole?: string }) => {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  
  if (allowedRole && user.role !== allowedRole) {
    if (user.role === 'admin') return <Navigate to="/admin-panel" />;
    return <Navigate to={user.role === 'instructor' ? '/instructor-panel' : '/select-course'} />;
  }
  
  return <>{children}</>;
};

function AppContent() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute allowedRole="student">
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/select-course" 
          element={
            <PrivateRoute allowedRole="student">
              <CourseSelection />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/instructor-panel" 
          element={
            <PrivateRoute allowedRole="instructor">
              <InstructorDashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/instructor/course/:id" 
          element={
            <PrivateRoute allowedRole="instructor">
              <CourseDetail />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/admin-panel" 
          element={
            <PrivateRoute allowedRole="admin">
              <AdminDashboard />
            </PrivateRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
