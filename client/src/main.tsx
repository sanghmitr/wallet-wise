import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { registerSW } from 'virtual:pwa-register';
import { App } from '@/app/App';
import { AppDataProvider } from '@/store/AppDataContext';
import '@/styles/index.css';

if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  void navigator.serviceWorker
    .getRegistrations()
    .then((registrations) =>
      Promise.all(registrations.map((registration) => registration.unregister())),
    )
    .catch((error) => {
      console.error('Failed to unregister service workers in development', error);
    });
} else {
  registerSW({ immediate: true });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppDataProvider>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            className: 'rounded-full border border-black/5 bg-white px-4 py-3 text-sm text-on-surface shadow-ambient',
          }}
        />
      </AppDataProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
