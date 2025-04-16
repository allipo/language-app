import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';

function AdminDashboard() {
  const [admins, setAdmins] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch admins
    const fetchAdmins = async () => {
      try {
        const response = await fetch('/api/admin', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch admins');
        
        const data = await response.json();
        setAdmins(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchAdmins();
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-dashboard">
      <header>
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout}>Logout</button>
      </header>
      
      {error && <div className="error">{error}</div>}
      
      <div className="nav-links">
        <Link to="/edit">Edit Word Group</Link>
        <Link to="/input">Input Word Group</Link>
      </div>
      
      <section>
        <h2>Admin Users</h2>
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Last Login</th>
            </tr>
          </thead>
          <tbody>
            {admins.map(admin => (
              <tr key={admin._id}>
                <td>{admin.username}</td>
                <td>{admin.role}</td>
                <td>{new Date(admin.lastLogin).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default AdminDashboard; 