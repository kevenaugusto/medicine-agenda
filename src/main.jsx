import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'
import { iniciarAgendador } from './notifications/scheduler.js'

// Registra o service worker (PWA instalável e uso offline).
registerSW({ immediate: true })

// Agendador de notificações locais de medicamento.
iniciarAgendador()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
