import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Se um chunk antigo falhar por conta de um novo deploy, recarrega limpo automaticamente
window.addEventListener('vite:preloadError', (event) => {
  window.location.reload();
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
