import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App.tsx';
import {initNative} from './lib/capacitor';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);

// Initialize native platform features (StatusBar style + SplashScreen hide).
// Runs after React mounts. No-op on web.
initNative();
