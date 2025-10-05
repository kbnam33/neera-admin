import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// The <StrictMode> wrapper has been removed to ensure compatibility.
createRoot(document.getElementById('root')).render(
    <App />
)