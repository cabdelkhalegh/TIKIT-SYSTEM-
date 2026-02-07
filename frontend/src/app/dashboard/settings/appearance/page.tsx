'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Palette, Sun, Moon, Monitor, Save } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type Theme = 'light' | 'dark' | 'system';
type Density = 'compact' | 'comfortable';

export default function AppearanceSettingsPage() {
  const [theme, setTheme] = useState<Theme>('system');
  const [fontSize, setFontSize] = useState<string>('medium');
  const [density, setDensity] = useState<Density>('comfortable');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSaving(false);
    toast.success('Settings saved');
  };

  const themeOptions = [
    { value: 'light' as Theme, label: 'Light', icon: Sun, description: 'Use light theme' },
    { value: 'dark' as Theme, label: 'Dark', icon: Moon, description: 'Use dark theme' },
    { value: 'system' as Theme, label: 'System', icon: Monitor, description: 'Follow system preference' },
  ];

  const fontSizeOptions = [
    { value: 'small', label: 'Small', sample: 'text-sm' },
    { value: 'medium', label: 'Medium', sample: 'text-base' },
    { value: 'large', label: 'Large', sample: 'text-lg' },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Appearance</h1>
          <p className="mt-1 text-gray-600">
            Customize the look and feel of your dashboard
          </p>
        </div>

        {/* Theme Selection */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Palette className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Theme</h2>
              <p className="text-sm text-gray-600">Select your preferred theme</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.value;
              return (
                <label
                  key={option.value}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="theme"
                    value={option.value}
                    checked={isSelected}
                    onChange={() => setTheme(option.value)}
                    className="h-4 w-4 border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <Icon className={`h-5 w-5 ${isSelected ? 'text-purple-600' : 'text-gray-500'}`} />
                  <div>
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </Card>

        {/* Font Size */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Font Size</h2>
          <div className="space-y-3">
            {fontSizeOptions.map((option) => (
              <label
                key={option.value}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  fontSize === option.value
                    ? 'bg-purple-50 border border-purple-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="fontSize"
                    value={option.value}
                    checked={fontSize === option.value}
                    onChange={() => setFontSize(option.value)}
                    className="h-4 w-4 border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="font-medium text-gray-900">{option.label}</span>
                </div>
                <span className={`text-gray-500 ${option.sample}`}>Aa</span>
              </label>
            ))}
          </div>
        </Card>

        {/* Sidebar Density */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sidebar Density</h2>
          <div className="space-y-3">
            <label
              className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                density === 'comfortable'
                  ? 'bg-purple-50 border border-purple-200'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <input
                type="radio"
                name="density"
                value="comfortable"
                checked={density === 'comfortable'}
                onChange={() => setDensity('comfortable')}
                className="mt-1 h-4 w-4 border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <div>
                <div className="font-medium text-gray-900">Comfortable</div>
                <div className="text-sm text-gray-600">More spacing between items for easier navigation</div>
              </div>
            </label>
            <label
              className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                density === 'compact'
                  ? 'bg-purple-50 border border-purple-200'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <input
                type="radio"
                name="density"
                value="compact"
                checked={density === 'compact'}
                onChange={() => setDensity('compact')}
                className="mt-1 h-4 w-4 border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <div>
                <div className="font-medium text-gray-900">Compact</div>
                <div className="text-sm text-gray-600">Less spacing to show more items at once</div>
              </div>
            </label>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
