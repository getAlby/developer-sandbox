import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { init } from '@getalby/bitcoin-connect-react'
import './index.css'
import App from './App.tsx'

init({
  appName: "Alby Sandbox",
  showBalance: true,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
