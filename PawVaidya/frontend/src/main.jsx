import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n/config.js'
import App from './App.jsx'
import { BrowserRouter } from "react-router-dom"
import AppContextProvider from './context/AppContext'
import { TranslationProvider } from './context/TranslationContext'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AppContextProvider>
      <TranslationProvider>
        <App />
      </TranslationProvider>
    </AppContextProvider>
  </BrowserRouter>,
)
