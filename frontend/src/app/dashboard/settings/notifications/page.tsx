'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Bell, Mail, Smartphone, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { NotificationPreferences } from '@/types/notification.types';

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      campaign: true,
      collaboration: true,
      payment: true,
      system: true,
      announcement: true,
    },
    inApp: {
      campaign: true,
      collaboration: true,
      payment: true,
      system: true,
      announcement: true,
    },
    frequency: 'realtime',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (channel: 'email' | 'inApp', type: keyof NotificationPreferences['email']) => {
    setPreferences((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [type]: !prev[channel][type],
      },
    }));
  };

  const handleFrequencyChange = (frequency: NotificationPreferences['frequency']) => {
    setPreferences((prev) => ({
      ...prev,
      frequency,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success('Notification preferences saved');
  };

  const notificationTypes = [
    { key: 'campaign' as const, label: 'Campaign Updates', description: 'New campaigns and status changes' },
    { key: 'collaboration' as const, label: 'Collaboration Updates', description: 'Invitations and milestone updates' },
    { key: 'payment' as const, label: 'Payment Notifications', description: 'Payment status and reminders' },
    { key: 'system' as const, label: 'System Notifications', description: 'System updates and maintenance' },
    { key: 'announcement' as const, label: 'Announcements', description: 'Product updates and news' },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Notification Preferences</h1>
          <p className="text-gray-600 mt-2">Manage how you receive notifications</p>
        </div>

        {/* Notification Channels */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Types</h2>
          <div className="space-y-6">
            {notificationTypes.map((type) => (
              <div key={type.key} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                <div className="mb-3">
                  <h3 className="font-medium text-gray-900">{type.label}</h3>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.email[type.key]}
                      onChange={() => handleToggle('email', type.key)}
                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Email</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.inApp[type.key]}
                      onChange={() => handleToggle('inApp', type.key)}
                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">In-App</span>
                    </div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Frequency Settings */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Frequency</h2>
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="frequency"
                checked={preferences.frequency === 'realtime'}
                onChange={() => handleFrequencyChange('realtime')}
                className="mt-1 h-4 w-4 border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Real-time</div>
                <div className="text-sm text-gray-600">Receive notifications immediately as they happen</div>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="frequency"
                checked={preferences.frequency === 'daily'}
                onChange={() => handleFrequencyChange('daily')}
                className="mt-1 h-4 w-4 border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Daily Digest</div>
                <div className="text-sm text-gray-600">Receive a summary of notifications once per day</div>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="frequency"
                checked={preferences.frequency === 'weekly'}
                onChange={() => handleFrequencyChange('weekly')}
                className="mt-1 h-4 w-4 border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Weekly Digest</div>
                <div className="text-sm text-gray-600">Receive a summary of notifications once per week</div>
              </div>
            </label>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
