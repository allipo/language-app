import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const storedAttempts = localStorage.getItem('failedAttempts');
    const storedLockout = localStorage.getItem('lockoutTime');
    if (storedAttempts) setFailedAttempts(parseInt(storedAttempts));
    if (storedLockout) {
      const lockoutEnd = new Date(storedLockout);
      if (lockoutEnd > new Date()) {
        setIsLocked(true);
        setLockoutTime(lockoutEnd);
      } else {
        localStorage.removeItem('failedAttempts');
        localStorage.removeItem('lockoutTime');
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) {
      setError(`Too many failed attempts. Please try again in ${Math.ceil((lockoutTime - new Date()) / 60000)} minutes.`);
      return;
    }

    try {
      const response = await fetch('https://allisons-language-app.de.r.appspot.com/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        localStorage.setItem('failedAttempts', newAttempts);

        if (newAttempts >= 5) {
          const lockoutEnd = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
          setIsLocked(true);
          setLockoutTime(lockoutEnd);
          localStorage.setItem('lockoutTime', lockoutEnd);
          setError(`Too many failed attempts. Please try again in 5 minutes.`);
        } else {
          throw new Error(data.message || 'Login failed');
        }
        return;
      }

      // Reset failed attempts on successful login
      localStorage.removeItem('failedAttempts');
      localStorage.removeItem('lockoutTime');
      setFailedAttempts(0);
      
      login(data.admin, data.token);
      navigate('/admindashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <h2>Admin Login</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLocked}
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLocked}
          />
        </div>
        <button type="submit" disabled={isLocked}>
          {isLocked ? 'Login Disabled' : 'Login'}
        </button>
      </form>
    </div>
  );
}

export default Login; 