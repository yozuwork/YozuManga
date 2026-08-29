import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import AuthGate from './components/auth/AuthGate.jsx'
import { DialogProvider } from './components/common/DialogProvider.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DialogProvider>
      <AuthGate>
        {(user) => <App user={user} />}
      </AuthGate>
    </DialogProvider>
  </StrictMode>,
)
