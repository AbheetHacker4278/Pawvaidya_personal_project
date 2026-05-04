import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { CSProvider } from './context/CSContext';
import App from './App.jsx';
import './index.css';

import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <CSProvider>
      <App />
    </CSProvider>
  </BrowserRouter>
);
