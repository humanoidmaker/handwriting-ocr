import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ScanLine, History, LayoutDashboard, Settings, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: { name: string; email: string } | null;
  onLogout: () => void;
}

const navItems = [
  { path: '/', label: 'Read', icon: ScanLine },
  { path: '/history', label: 'History', icon: History },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout({ children, user, onLogout }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-primary-500 text-white flex flex-col fixed h-full">
        <div className="p-6 border-b border-primary-400">
          <h1 className="text-xl font-bold">ScribeAI</h1>
          <p className="text-primary-200 text-sm mt-1">Handwriting OCR</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === path
                  ? 'bg-accent-500 text-white'
                  : 'text-primary-100 hover:bg-primary-400'
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-primary-400">
          <div className="text-sm text-primary-200 mb-2">{user?.name}</div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-primary-200 hover:text-white transition-colors text-sm"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>
      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}
