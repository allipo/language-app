import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Learn from './pages/Learn';
import Input from './pages/Input';
import Listen from './pages/Listen';
import Guess from './pages/Guess';
import Reinforce from './pages/Reinforce';
import Sentence from './pages/Sentence';
import Speak from './pages/Speak';
import Translate from './pages/Translate';
import Definition from './pages/Definition';
import Edit from './pages/Edit';
import EditWordGroup from './pages/EditWordGroup';
import GroupLaunch from './pages/GroupLaunch';
import Congratulations from './pages/Congratulations';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import { GroupProvider } from './context/GroupContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import DropdownMenu from './components/DropdownMenu';
import SettingsDropdown from './components/SettingsDropdown';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function AppContent() {
  const { isAdmin } = useAuth();

  return (
    <Router>
      <div className="App">
        <nav>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><DropdownMenu /></li>
            <li><SettingsDropdown /></li>
            {isAdmin && (
              <>
                <li><Link to="/input">Input</Link></li>
                <li><Link to="/edit">Edit</Link></li>
              </>
            )}
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admindashboard" element={<AdminDashboard />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/group-launch" element={<GroupLaunch />} />
          <Route path="/input" element={
            <ProtectedRoute>
              <Input />
            </ProtectedRoute>
          } />
          <Route path="/edit" element={
            <ProtectedRoute>
              <Edit />
            </ProtectedRoute>
          } />
          <Route path="/edit/group/:groupId" element={
            <ProtectedRoute>
              <EditWordGroup />
            </ProtectedRoute>
          } />
          <Route path="/listen" element={<Listen />} />
          <Route path="/guess" element={<Guess />} />
          <Route path="/reinforce" element={<Reinforce />} />
          <Route path="/sentence" element={<Sentence />} />
          <Route path="/speak" element={<Speak />} />
          <Route path="/translate" element={<Translate />} />
          <Route path="/definition" element={<Definition />} />
          <Route path="/congratulations" element={<Congratulations />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <LanguageProvider>
      <GroupProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </GroupProvider>
    </LanguageProvider>
  );
}

export default App;
