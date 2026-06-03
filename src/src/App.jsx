import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Projects from './pages/Project';
import Attendance from './pages/Attendace';
import Interns from './pages/Interns';
import Achievements from './pages/Achievements';
import InternAttendance from './pages/InternAttendance';
import Login from './pages/Login';
import Signup from './pages/Signup';
import HRDashboard from './pages/HRDashboard';

const pages = {
  login: Login,
  signup: Signup,
  dashboard: Dashboard,
  HRDashboard: HRDashboard,
  Hrdashboard: HRDashboard,
  employees: Employees,
  projects: Projects,
  attendance: Attendance,
  interns: Interns,
  achievements: Achievements,
  internAttendance: InternAttendance,
};

function App() {
  const [currentPage, setCurrentPage] = useState('login');

  // ── Auto-login: agar email stored hai toh login screen skip karo ──
  useEffect(() => {
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
      if (savedEmail.trim().toLowerCase() === 'admin@wellmind.com') {
        setCurrentPage('dashboard');
      } else {
        setCurrentPage('dashboard');
      }
    }
  }, []);

  const PageComponent = pages[currentPage];

  return (
    <div className="app-container">
      {PageComponent ? (
        <PageComponent onNavigate={setCurrentPage} />
      ) : (
        <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
          <h2>Page Not Found</h2>
          <p>Unknown page: "{currentPage}"</p>
          <button onClick={() => setCurrentPage('login')}>Go to Login</button>
        </div>
      )}
    </div>
  );
}

export default App;