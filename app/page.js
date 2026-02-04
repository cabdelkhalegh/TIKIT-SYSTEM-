export default function Home() {
  return (
    <main style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(to bottom, #f0f9ff, #e0f2fe)'
    }}>
      <div style={{ 
        padding: '3rem', 
        textAlign: 'center',
        maxWidth: '800px'
      }}>
        <h1 style={{ 
          fontSize: '3rem', 
          marginBottom: '1rem',
          color: '#0369a1'
        }}>
          🎫 Welcome to TIKIT System
        </h1>
        <p style={{ 
          fontSize: '1.5rem', 
          marginBottom: '2rem',
          color: '#475569'
        }}>
          Your Modern Ticket Management Solution
        </p>
        
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          marginTop: '2rem'
        }}>
          <h2 style={{ 
            fontSize: '1.5rem',
            marginBottom: '1rem',
            color: '#0c4a6e'
          }}>
            ✅ Deployment Ready!
          </h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            Your application is successfully built and ready to deploy.
          </p>
          
          <div style={{
            textAlign: 'left',
            background: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '8px',
            marginTop: '1rem'
          }}>
            <h3 style={{ 
              fontSize: '1.2rem',
              marginBottom: '1rem',
              color: '#0c4a6e'
            }}>
              📋 Next Steps:
            </h3>
            <ol style={{ 
              paddingLeft: '1.5rem',
              lineHeight: '2',
              color: '#475569'
            }}>
              <li>Deploy to Vercel (visit <a href="https://vercel.com" target="_blank" rel="noopener" style={{ color: '#0369a1' }}>vercel.com</a>)</li>
              <li>Read NEXT_STEPS.md for detailed guidance</li>
              <li>Start building your ticket features</li>
              <li>Add authentication & database</li>
            </ol>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <p style={{ 
              fontSize: '0.9rem',
              color: '#64748b',
              fontStyle: 'italic'
            }}>
              💡 See NEXT_STEPS.md in your repository for a complete development guide
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
