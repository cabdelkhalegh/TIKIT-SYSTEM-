'use client';

import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  CreditCard,
  ChevronRight 
} from 'lucide-react';

const settingsSections = [
  {
    title: 'Profile',
    description: 'Manage your personal information and account details',
    icon: User,
    href: '/dashboard/settings/profile',
    color: 'text-purple-600 bg-purple-100',
  },
  {
    title: 'Notifications',
    description: 'Configure how you receive updates and alerts',
    icon: Bell,
    href: '/dashboard/settings/notifications',
    color: 'text-blue-600 bg-blue-100',
  },
  {
    title: 'Security',
    description: 'Update password and security preferences',
    icon: Shield,
    href: '/dashboard/settings/security',
    color: 'text-green-600 bg-green-100',
  },
  {
    title: 'Appearance',
    description: 'Customize the look and feel of your dashboard',
    icon: Palette,
    href: '/dashboard/settings/appearance',
    color: 'text-orange-600 bg-orange-100',
  },
  {
    title: 'Language & Region',
    description: 'Set your language, timezone, and regional preferences',
    icon: Globe,
    href: '/dashboard/settings/region',
    color: 'text-indigo-600 bg-indigo-100',
  },
  {
    title: 'Billing',
    description: 'Manage subscription and payment methods',
    icon: CreditCard,
    href: '/dashboard/settings/billing',
    color: 'text-pink-600 bg-pink-100',
  },
];

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            return (
              <Link key={section.href} href={section.href}>
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${section.color} mb-4`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {section.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {section.description}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/dashboard/settings/profile"
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
              >
                <User className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Edit Profile</span>
              </Link>
              <Link
                href="/dashboard/settings/security"
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
              >
                <Shield className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Change Password</span>
              </Link>
              <Link
                href="/dashboard/settings/notifications"
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <Bell className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Notification Settings</span>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
