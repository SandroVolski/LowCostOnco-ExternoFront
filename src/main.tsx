
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { AdminProvider } from './contexts/AdminContext';

const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);
  
  root.render(
    <React.StrictMode>
      <ThemeProvider>
        <AdminProvider>
        <App />
        </AdminProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
} else {
  console.error("Root element not found");
}
