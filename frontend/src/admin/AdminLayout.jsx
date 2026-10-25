import React, { useState } from 'react';
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context';
import { ToastProvider } from './components';
import {
  LayoutDashboard,
  Bell,
  BookOpen,
  FileDown,
  HelpCircle,
  ClipboardList,
  Award,
  Menu,
  X,
  ShieldCheck,
  ArrowLeft,
  LogOut,
  ChevronRight,
} from 'lucide-react';

export default function AdminLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Notifications', path: '/admin/notifications', icon: Bell },
    { name: 'Study Materials', path: '/admin/study-materials', icon: BookOpen },
    { name: 'Downloads', path: '/admin/downloads', icon: FileDown },
    { name: 'Questions', path: '/admin/questions', icon: HelpCircle },
    { name: 'Mock Tests', path: '/admin/mock-tests', icon: ClipboardList },
    { name: 'Results', path: '/admin/results', icon: Award },
  ];

  const isLinkActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-100/60 flex flex-col lg:flex-row">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0">
          {/* Admin Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight font-outfit">
                PGCET Admin
              </span>
              <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">
                Management Console
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Admin Sections
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isLinkActive(item);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition duration-150 ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* User & Portal Controls Footer */}
          <div className="p-3 border-t border-slate-800/80 space-y-2">
            <Link
              to="/"
              className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition"
            >
              <div className="flex items-center gap-2">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Public Portal</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            </Link>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    {user?.name || 'Administrator'}
                  </p>
                  <p className="text-[10px] text-indigo-400 font-medium capitalize">
                    {user?.role || 'Admin'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700/50 transition cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="lg:hidden bg-slate-900 text-white border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-16 z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm">PGCET Admin</span>
              <p className="text-[10px] text-indigo-400 leading-tight">Admin Console</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
              aria-label="Toggle admin navigation menu"
            >
              {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Sidebar Dropdown */}
        {mobileSidebarOpen && (
          <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 space-y-2 animate-in slide-in-from-top-2">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isLinkActive(item);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                      active
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-40" />
                  </NavLink>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <Link
                to="/"
                onClick={() => setMobileSidebarOpen(false)}
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to Portal
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          </div>
        )}

        {/* Main Admin Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </ToastProvider>
  );
}
