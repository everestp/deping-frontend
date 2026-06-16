import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SolanaWalletProvider } from './context/SolanaWallet';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PublicShell } from './components/Layout/PublicShell';
import { AppShell } from './components/Layout/AppShell';

import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import MonitorConfig from './pages/MonitorConfig';
import MinerNode from './pages/MinerNode';
import Settings from './pages/Settings';
import Help from './pages/Help';
import TelegramPage from './pages/TeleGramPage';
import Dashboard from './pages/Dashboard';
import  { Toaster } from 'react-hot-toast';



function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // FIXED: Accessing 'loading' and 'loggedIn' from the auth-api hook
  const { loading, loggedIn } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="flex items-center gap-3 text-sky-400 font-mono-data text-sm">
          <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          Authenticating...
        </div>
      </div>
    );
  }

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

      </Route>

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/monitor" element={<MonitorConfig />} />
        <Route path="/miner" element={<MinerNode />} />
        <Route path="/telegram" element={<TelegramPage />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/help" element={<Help />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <>
    <Toaster />
    <BrowserRouter>
      <AuthProvider>
        <SolanaWalletProvider>
          <AppRoutes />
        </SolanaWalletProvider>
      </AuthProvider>
    </BrowserRouter>
    </>
  );
}
