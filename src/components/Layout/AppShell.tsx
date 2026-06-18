import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <Navbar />

      <div className="flex flex-1 relative">
        <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed bottom-4 right-4 z-50 lg:hidden w-12 h-12 rounded-full glass border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-lg glow-blue"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Main content area — offset by sidebar width on lg+ */}
        <main className="flex-1 lg:pl-[220px] transition-all duration-300 min-w-0">
          <div className="p-4 md:p-6 max-w-screen-xl mx-auto">
            <Outlet />
          </div>
          {/* <Footer /> */}
        </main>
      </div>
    </div>
  );
}
