"use client";

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ChevronDown, LogOut, Moon, Sun, User, Zap, LayoutDashboard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../Common/Button';

import '@solana/wallet-adapter-react-ui/styles.css';

export function Navbar() {
  const { user, doLogout, loggedIn } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('dp_theme');
    const dark = stored !== 'light';
    setIsDark(dark);
    document.documentElement.classList.toggle('light', !dark);
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('light', !next);
    localStorage.setItem('dp_theme', next ? 'dark' : 'light');
  }

  return (
    <nav className="glass sticky top-0 z-50 border-b border-[var(--border-subtle)]">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">
        
        {/* Brand - Redirects based on auth state */}
        <Link to={ "/"} className="flex items-center gap-2.5 shrink-0">
          <div className="relative">
            <Zap className="w-5 h-5 text-[var(--accent-blue)]" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse-dot" />
          </div>
          <span className="font-mono-data font-bold text-lg text-[var(--text-primary)] tracking-tight">
            deping.xyz
          </span>
        </Link>

        {/* Right Cluster */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-secondary)] border border-[var(--border-subtle)]"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {loggedIn ? (
            <>
              {/* Go to Dashboard Button */}
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="hidden md:flex gap-2">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </Button>
              </Link>

              {/* Wallet Connect */}
              <div className="wallet-theme-wrapper">
                <WalletMultiButton />
              </div>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((p) => !p)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-secondary)] border border-[var(--border-subtle)] transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-[var(--primary)]/20 border border-[var(--primary)]/40 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-[var(--primary)]" />
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 glass rounded-xl border border-[var(--border-subtle)] py-1 shadow-2xl z-50">
                    <div className="px-3 py-2 border-b border-[var(--border-subtle)]">
                      <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Account</p>
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate font-mono-data">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => { doLogout(); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--accent-red)] hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login"><Button variant="ghost" size="sm">Login</Button></Link>
              <Link to="/signup"><Button size="sm">Get Started</Button></Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}