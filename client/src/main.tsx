import '@mantine/core/styles.css';
import './index.scss';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { ConfigProvider } from './context/ConfigContext';
import { LoadingProvider } from './context/LoadingContext';

import App from './App';

const root = document.getElementById('app');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <LoadingProvider>
        <ConfigProvider>
          <App />
        </ConfigProvider>
      </LoadingProvider>
    </StrictMode>,
  );
}
