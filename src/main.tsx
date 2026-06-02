
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

import './index.css';
import 'leaflet/dist/leaflet.css'
import { DataContextProvider } from './solana/providers/DataContext.jsx'
import AppWalletProvider from './solana/providers/AppWalletProvider.jsx'
import { Buffer } from "buffer";
window.Buffer = Buffer;
window.global = window;
createRoot(document.getElementById('root')!).render(
    <AppWalletProvider>

      <DataContextProvider>
        <App />
      </DataContextProvider>

  </AppWalletProvider>
);
