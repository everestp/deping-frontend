import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Activity,
  Settings,
  HelpCircle,
  Send,
} from 'lucide-react';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard' },
  { to: '/monitor', icon: <Target className="w-4 h-4" />, label: 'Monitor Config' },
  { to: '/miner', icon: <Cpu className="w-4 h-4" />, label: 'Miner Node', badge: 'LIVE' },
  { to: '/telegram', icon: <Send className="w-4 h-4" />, label: 'Telegram', badge: 'LIVE' },
];

const BOTTOM_ITEMS: NavItem[] = [
  { to: '/settings', icon: <Settings className="w-4 h-4" />, label: 'Settings' },
  { to: '/help', icon: <HelpCircle className="w-4 h-4" />, label: 'Help' },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const width = collapsed ? 'w-16' : 'w-[220px]';

  const NavItem = ({ item }: { item: NavItem }) => (
    <NavLink
      to={item.to}
      onClick={onMobileClose}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 relative group',
          isActive
            ? 'nav-link-active text-sky-400'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <span className={isActive ? 'text-sky-400' : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'}>
            {item.icon}
          </span>
          {!collapsed && (
            <span className="font-medium truncate flex-1">{item.label}</span>
          )}
          {!collapsed && item.badge && (
            <span className="px-1.5 py-0.5 text-[10px] font-mono-data font-semibold rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              {item.badge}
            </span>
          )}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 glass rounded-lg text-xs text-[var(--text-primary)] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              {item.label}
            </div>
          )}
        </>
      )}
    </NavLink>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'fixed top-14 bottom-0 left-0 z-40',
          'flex flex-col glass border-r border-[var(--border-subtle)]',
          'transition-all duration-300',
          width,
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0 w-[220px]' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        {/* Nav items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="mb-4">
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Navigation
              </p>
            )}
            {NAV_ITEMS.map((item) => (
              <NavItem key={item.to} item={item} />
            ))}
          </div>

          <div className="border-t border-[var(--border-subtle)] pt-3">
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                General
              </p>
            )}
            {BOTTOM_ITEMS.map((item) => (
              <NavItem key={item.to} item={item} />
            ))}
          </div>
        </div>

        {/* Collapse toggle */}
        <div className="p-3 border-t border-[var(--border-subtle)] hidden lg:block">
          <button
            onClick={() => setCollapsed((p) => !p)}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Status footer */}
        {!collapsed && (
          <div className="px-4 py-3 border-t border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span className="font-mono-data">v0.9.4-beta</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
