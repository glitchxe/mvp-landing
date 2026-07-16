import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import MVPClub from './pages/MVPClub.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ background: '#060504', color: '#F0EAE0', padding: '2rem', fontFamily: 'monospace', minHeight: '100vh' }}>
          <h2 style={{ color: '#f03a28' }}>Runtime Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#C4A04A', fontSize: '0.85rem' }}>
            {this.state.error?.toString()}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

const isClub = window.location.pathname.startsWith('/mvpclub')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      {isClub ? <MVPClub /> : <App />}
    </ErrorBoundary>
  </StrictMode>,
)
