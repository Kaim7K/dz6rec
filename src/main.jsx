import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import InterfaceBoundary from '@/components/InterfaceBoundary'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <InterfaceBoundary><App /></InterfaceBoundary>
)
