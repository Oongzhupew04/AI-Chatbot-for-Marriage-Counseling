import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // This applies all your awesome styling!

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client for React Query (handles our API calls)
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}