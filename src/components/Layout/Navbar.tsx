import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, Wallet, ChevronDown, LogOut, User, Zap } from 'lucide-react';
// Import from the new Context wrapper
import { useAuth } from '../../context/AuthContext';
import { useSolanaWallet } from '../../context/SolanaWallet';
import { Button } from '../Common/Button';

export function Navbar() {
  // Access variables exactly as they are named in the AuthContext/lib hook
  const { user, doLogout, loggedIn } = useAuth();
  const { wallet, connecting, connect, disconnect, truncatedKey } = useSolanaWallet();
  const [isDark, setIsDark] = useState(true);
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
        {/* Brand */}
        <Link to={loggedIn ? '/dashboard' : '/'} className="flex items-center gap-2.5 shrink-0">
          <div className="relative">
            <Zap className="w-5 h-5 text-sky-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot" />
          </div>
          <span className="font-mono-data font-bold text-lg text-gradient-brand tracking-tight">
            deping.xyz
          </span>
        </Link>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/8 transition-colors text-[var(--text-secondary)]"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Wallet connect */}
          {loggedIn && (
            <>
              {wallet.connected ? (
                <button
                  onClick={disconnect}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-500/30 bg-sky-500/8 text-sky-400 text-xs font-mono-data hover:bg-sky-500/15"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  {truncatedKey}
                </button>
              ) : (
                <Button size="sm" variant="secondary" loading={connecting} onClick={connect} className="hidden sm:flex">
                  <Wallet className="w-3.5 h-3.5" />
                  Connect Wallet
                </Button>
              )}
            </>
          )}

          {/* User menu */}
          {loggedIn ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((p) => !p)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/6 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 glass rounded-xl border border-[var(--border-subtle)] py-1 shadow-xl z-50">
                  <div className="px-3 py-2 border-b border-[var(--border-subtle)]">
                    <p className="text-xs text-[var(--text-muted)]">Signed in as</p>
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { doLogout(); setUserMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/8"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login"><Button size="sm" variant="ghost">Login</Button></Link>
              <Link to="/signup"><Button size="sm">Get Started</Button></Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
