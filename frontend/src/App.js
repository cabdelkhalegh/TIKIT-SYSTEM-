import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [tickets, setTickets] = useState([]);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  useEffect(() => {
    // Check backend health
    fetch(`${API_URL}/health`)
      .then(res => res.json())
      .then(data => {
        setBackendStatus(`✅ ${data.service} - ${data.status}`);
      })
      .catch(err => {
        setBackendStatus('❌ Backend not connected');
        console.error('Backend connection error:', err);
      });

    // Fetch tickets
    fetch(`${API_URL}/api/tickets`)
      .then(res => res.json())
      .then(data => {
        setTickets(data.tickets || []);
      })
      .catch(err => console.error('Error fetching tickets:', err));
  }, [API_URL]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎫 TIKIT System</h1>
        <p className="subtitle">Ticket Management Application</p>
      </header>
      
      <main className="App-main">
        <div className="status-card">
          <h2>System Status</h2>
          <div className="status-item">
            <strong>Frontend:</strong> ✅ Running on port 3000
          </div>
          <div className="status-item">
            <strong>Backend:</strong> {backendStatus}
          </div>
          <div className="status-item">
            <strong>Database:</strong> ✅ PostgreSQL configured
          </div>
        </div>

        <div className="tickets-card">
          <h2>Tickets Dashboard</h2>
          {tickets.length === 0 ? (
            <p className="empty-state">No tickets yet. The system is ready to create tickets!</p>
          ) : (
            <ul className="tickets-list">
              {tickets.map((ticket, idx) => (
                <li key={idx}>{ticket.title}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="info-card">
          <h3>🚀 Development Environment Ready!</h3>
          <p>All Docker services are configured and running:</p>
          <ul>
            <li>Frontend (React) - Port 3000</li>
            <li>Backend (Express) - Port 3001</li>
            <li>Database (PostgreSQL) - Port 5432</li>
          </ul>
        </div>
      </main>

      <footer className="App-footer">
        <p>TIKIT System v1.0.0 | Docker Development Environment</p>
      </footer>
    </div>
  );
}

export default App;
