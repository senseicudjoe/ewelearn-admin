// src/components/layout/DashboardLayout.tsx

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import logoUrl from "../../assets/images/logo.png"
import {
  BookOpen,
  FileText,
  ClipboardCheck,
  LogOut,
  Menu,
  X,
  LayoutDashboard
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  teacherOnly?: boolean;
}

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    // Admins reach lessons by drilling into a module, so no flat lesson list for them.
    { label: 'Modules', path: '/modules', icon: <BookOpen className="w-4 h-4" />, adminOnly: true },
    { label: 'My Lessons', path: '/lessons', icon: <FileText className="w-4 h-4" />, teacherOnly: true },
    { label: 'Pending Review', path: '/pending', icon: <ClipboardCheck className="w-4 h-4" />, adminOnly: true },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.teacherOnly && isAdmin) return false;
    return true;
  });

  // Highlight the current section, including nested routes like
  // /modules/:moduleId/lessons which should still light up "Modules".
  const isItemActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50/80">
      {/* Top Bar: logo, inline nav, user chip + logout */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-4">
            {/* Left cluster: mobile toggle + brand */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-white shadow-sm overflow-hidden">
                  <img src={logoUrl} alt="EweLearn" className="h-9 w-9 object-cover" />
                </div>
                <span className="text-lg font-semibold tracking-tight text-slate-900 truncate">
                  EweLearn Admin
                </span>
              </Link>
            </div>

            {/* Center: horizontal nav (desktop only) */}
            <nav className="hidden lg:flex items-center gap-1">
              {filteredNavItems.map((item) => {
                const isActive = isItemActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                      ${isActive
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }
                    `}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right cluster: user chip + logout */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 rounded-lg bg-slate-100/80 px-3 py-1.5">
                <p className="text-sm font-medium text-slate-800">{currentUser?.displayName}</p>
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded">
                  {currentUser?.role}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                <LogOut className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile nav drawer — folds out under the top bar on small screens */}
        {mobileNavOpen && (
          <nav className="lg:hidden border-t border-slate-200/80 bg-white px-4 py-3 space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = isItemActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileNavOpen(false)}
                  className={`
                    flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }
                  `}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      {/* Full-width main content — no more sidebar gutter */}
      <main className="min-h-[calc(100vh-3.5rem)] p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};
