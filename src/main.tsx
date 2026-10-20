import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

// Prevent default browser context menu in desktop webview
if (typeof window !== 'undefined') {
  window.addEventListener('contextmenu', (e) => {
    // Only block context menu inside Tauri desktop environment
    if ((window as any).__TAURI_INTERNALS__) {
      e.preventDefault();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
