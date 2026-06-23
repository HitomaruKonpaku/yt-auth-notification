import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './index.scss';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { ConfigProvider } from './context/ConfigContext';
import { DataProvider } from './context/DataContext';
import { LoadingProvider } from './context/LoadingContext';

import App from './App';

const root = document.getElementById('app');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <LoadingProvider>
        <ConfigProvider>
          <DataProvider>
            <App />
          </DataProvider>
        </ConfigProvider>
      </LoadingProvider>
    </StrictMode>,
  );
}
