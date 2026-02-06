import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [backendStatus, setBackendStatus] = useState(null);
  const [dbStatus, setDbStatus] = useState(null);
  const [apiInfo, setApiInfo] = useState(null);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  useEffect(() => {
    // Test backend health
    fetch(`${apiUrl}/health`)
      .then(res => res.json())
      .then(data => setBackendStatus(data))
      .catch(err => setBackendStatus({ 
        status: 'error', 
        message: err.message,
        hint: 'Is the backend service running on port 3001?' 
      }));

    // Test database connectivity
    fetch(`${apiUrl}/db-test`)
      .then(res => res.json())
      .then(data => setDbStatus(data))
      .catch(err => setDbStatus({ 
        status: 'error', 
        message: err.message,
        hint: 'Check if database is accessible and backend is connected' 
      }));

    // Get API info
    fetch(`${apiUrl}/api/info`)
      .then(res => res.json())
      .then(data => setApiInfo(data))
      .catch(err => setApiInfo({ 
        error: err.message,
        hint: 'Verify backend API is accessible' 
      }));
  }, [apiUrl]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎫 TIKIT System</h1>
        <p>Ticket Management Application</p>
        
        <div className="status-container">
          <div className="status-card">
            <h3>Backend Status</h3>
            {backendStatus ? (
              <pre>{JSON.stringify(backendStatus, null, 2)}</pre>
            ) : (
              <p>Loading...</p>
            )}
          </div>

          <div className="status-card">
            <h3>Database Status</h3>
            {dbStatus ? (
              <pre>{JSON.stringify(dbStatus, null, 2)}</pre>
            ) : (
              <p>Loading...</p>
            )}
          </div>

          <div className="status-card">
            <h3>API Info</h3>
            {apiInfo ? (
              <pre>{JSON.stringify(apiInfo, null, 2)}</pre>
            ) : (
              <p>Loading...</p>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
