'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', status: 'open' });

  useEffect(() => {
    const user = localStorage.getItem('tikit_current_user');
    if (!user) { router.push('/login'); return; }
    setCurrentUser(user);
    loadTickets();
  }, [router]);

  const loadTickets = () => {
    setTickets(JSON.parse(localStorage.getItem('tikit_tickets') || '[]'));
  };

  const createTicket = (e) => {
    e.preventDefault();
    if (!form.title || !form.description) { alert('Fill all fields'); return; }
    const ticket = { id: Date.now(), ...form, createdBy: currentUser, createdAt: new Date().toISOString() };
    const all = JSON.parse(localStorage.getItem('tikit_tickets') || '[]');
    all.push(ticket);
    localStorage.setItem('tikit_tickets', JSON.stringify(all));
    setForm({ title: '', description: '', priority: 'medium', status: 'open' });
    setShowForm(false);
    loadTickets();
  };

  const deleteTicket = (id) => {
    if (!confirm('Delete ticket?')) return;
    const all = JSON.parse(localStorage.getItem('tikit_tickets') || '[]');
    localStorage.setItem('tikit_tickets', JSON.stringify(all.filter(t => t.id !== id)));
    loadTickets();
  };

  const updateStatus = (id, status) => {
    const all = JSON.parse(localStorage.getItem('tikit_tickets') || '[]');
    localStorage.setItem('tikit_tickets', JSON.stringify(all.map(t => t.id === id ? { ...t, status } : t)));
    loadTickets();
  };

  const logout = () => {
    localStorage.removeItem('tikit_current_user');
    router.push('/login');
  };

  if (!currentUser) return <div>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '1rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', color: '#0369a1', fontWeight: 'bold' }}>🎫 TIKIT Dashboard</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span>👤 {currentUser}</span>
            <button onClick={logout} style={{ padding: '0.5rem 1rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Logout</button>
          </div>
        </div>
      </div>
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Total</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0369a1' }}>{tickets.length}</div>
          </div>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Open</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>{tickets.filter(t => t.status === 'open').length}</div>
          </div>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>In Progress</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#eab308' }}>{tickets.filter(t => t.status === 'in-progress').length}</div>
          </div>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Resolved</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#22c55e' }}>{tickets.filter(t => t.status === 'resolved').length}</div>
          </div>
        </div>

        <button onClick={() => setShowForm(!showForm)} style={{ padding: '0.75rem 1.5rem', background: '#0369a1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '2rem' }}>
          {showForm ? '✕ Cancel' : '+ Create Ticket'}
        </button>

        {showForm && (
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Create Ticket</h2>
            <form onSubmit={createTicket}>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', marginBottom: '1rem' }} />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={4} style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', marginBottom: '1rem', fontFamily: 'inherit' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px' }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px' }}>
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#0369a1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Create</button>
            </form>
          </div>
        )}

        <h2 style={{ marginBottom: '1rem' }}>All Tickets</h2>
        {tickets.length === 0 ? (
          <div style={{ background: 'white', padding: '3rem', borderRadius: '8px', textAlign: 'center', color: '#64748b' }}>No tickets yet!</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tickets.map(t => (
              <div key={t.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{t.title}</h3>
                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>{t.description}</p>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                      {new Date(t.createdAt).toLocaleDateString()} · {t.createdBy}
                    </div>
                  </div>
                  <button onClick={() => deleteTicket(t.id)} style={{ padding: '0.5rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', height: 'fit-content' }}>🗑️</button>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', background: t.priority === 'high' ? '#fecaca' : t.priority === 'medium' ? '#fed7aa' : '#bbf7d0', color: t.priority === 'high' ? '#dc2626' : t.priority === 'medium' ? '#ea580c' : '#16a34a' }}>{t.priority.toUpperCase()}</span>
                  <select value={t.status} onChange={(e) => updateStatus(t.id, e.target.value)} style={{ padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid #d1d5db', cursor: 'pointer' }}>
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
