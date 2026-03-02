'use client';

import { ReactNode, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import {
  LayoutDashboard,
  Target,
  Users,
  Handshake,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  Shield,
  ClipboardCheck,
  DollarSign,
  FileText,
  Bell,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import GlobalSearch from '@/components/dashboard/GlobalSearch';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  // Which roles can see this nav item. Empty array = everyone.
  allowedRoles?: string[];
}

// Full navigation definition with role-based visibility
const allNavigation: NavItem[] = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/dashboard/clients', icon: Building2, allowedRoles: ['director', 'campaign_manager', 'reviewer', 'finance'] },
  { name: 'Campaigns', href: '/dashboard/campaigns', icon: Target, allowedRoles: ['director', 'campaign_manager', 'reviewer'] },
  { name: 'Influencers', href: '/dashboard/influencers', icon: Users, allowedRoles: ['director', 'campaign_manager', 'reviewer'] },
  { name: 'Collaborations', href: '/dashboard/collaborations', icon: Handshake, allowedRoles: ['director', 'campaign_manager', 'reviewer'] },
  { name: 'Content', href: '/dashboard/content', icon: FileText, allowedRoles: ['director', 'campaign_manager', 'reviewer', 'client', 'influencer'] },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, allowedRoles: ['director', 'campaign_manager', 'reviewer', 'finance'] },
  { name: 'Finance', href: '/dashboard/finance', icon: DollarSign, allowedRoles: ['director', 'finance'] },
  { name: 'Reports', href: '/dashboard/reports', icon: ClipboardList, allowedRoles: ['director', 'campaign_manager', 'reviewer'] },
  { name: 'Reminders', href: '/dashboard/reminders', icon: Bell, allowedRoles: ['director', 'campaign_manager', 'reviewer', 'finance'] },
  // Director-only admin sections
  { name: 'Registrations', href: '/dashboard/licensing', icon: ClipboardCheck, allowedRoles: ['director'] },
  { name: 'User Roles', href: '/dashboard/roles', icon: Shield, allowedRoles: ['director'] },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { roles, isClient, isInfluencer, hasAnyRole } = useRoleAccess();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Filter navigation based on user roles
  const navigation = useMemo(() => {
    return allNavigation.filter((item) => {
      // No role restriction — visible to all
      if (!item.allowedRoles || item.allowedRoles.length === 0) return true;
      // Check if user has any of the allowed roles
      return hasAnyRole(item.allowedRoles as any[]);
    });
  }, [roles, hasAnyRole]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <Link href="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              TIKIT
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center px-4 py-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold">
                  {user?.fullName?.[0]?.toUpperCase() || 'U'}
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.fullName || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
            </div>
            {/* Role badges */}
            {roles.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2 px-4">
                {roles.map((r) => (
                  <span key={r} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 font-medium">
                    {r.replace('_', ' ')}
                  </span>
                ))}
              </div>
            )}
            <button
              onClick={handleLogout}
              className="mt-2 w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1">
            <GlobalSearch />
          </div>
          <NotificationCenter />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
