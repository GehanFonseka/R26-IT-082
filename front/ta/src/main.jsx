import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthSessionProvider } from './shared/context/AuthSessionContext'
import { SharedCvProvider } from './shared/context/SharedCvContext'
import { ThemeProvider } from './shared/context/ThemeContext'
import { UserModeProvider } from './shared/context/UserModeContext'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <UserModeProvider>
        <AuthSessionProvider>
          <SharedCvProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </SharedCvProvider>
        </AuthSessionProvider>
      </UserModeProvider>
    </ThemeProvider>
  </StrictMode>,
)
