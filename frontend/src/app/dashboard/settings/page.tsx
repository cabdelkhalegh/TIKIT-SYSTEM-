'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Lock, Bell, Settings as SettingsIcon, Save, CheckCircle2 } from 'lucide-react';

interface UserProfile {
  userId: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  company?: string;
}

export default function SettingsPage() {
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    company: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);
  const [showProfileSuccess, setShowProfileSuccess] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await apiClient.get('/auth/profile');
      const data = response.data as UserProfile;
      setProfileData({
        fullName: data.fullName || '',
        email: data.email || '',
        phoneNumber: data.phoneNumber || '',
        company: data.company || '',
      });
      return data;
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      const response = await apiClient.patch('/auth/profile', data);
      return response.data;
    },
    onSuccess: () => {
      setShowProfileSuccess(true);
      setTimeout(() => setShowProfileSuccess(false), 3000);
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwordData) => {
      const response = await apiClient.post('/auth/change-password', data);
      return response.data;
    },
    onSuccess: () => {
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordSuccess(true);
      setTimeout(() => setShowPasswordSuccess(false), 3000);
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    updatePasswordMutation.mutate(passwordData);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-2 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
          </div>
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3].map((j) => (
                      <div key={j}>
                        <div className="h-4 bg-gray-200 rounded w-1/6 mb-2" />
                        <div className="h-10 bg-gray-200 rounded" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

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

        <div className="max-w-4xl space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-purple-600" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={profileData.fullName}
                      onChange={(e) =>
                        setProfileData({ ...profileData, fullName: e.target.value })
                      }
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData({ ...profileData, email: e.target.value })
                        }
                        placeholder="john@example.com"
                        className="pl-10"
                        disabled
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      value={profileData.phoneNumber}
                      onChange={(e) =>
                        setProfileData({ ...profileData, phoneNumber: e.target.value })
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={profileData.company}
                      onChange={(e) =>
                        setProfileData({ ...profileData, company: e.target.value })
                      }
                      placeholder="ACME Inc."
                    />
                  </div>
                </div>

                {showProfileSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <p className="text-sm text-green-800">Profile updated successfully!</p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700"
                    disabled={updateProfileMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Password Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-purple-600" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    placeholder="Enter current password"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                      }
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                      }
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                {showPasswordSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <p className="text-sm text-green-800">Password changed successfully!</p>
                  </div>
                )}

                {updatePasswordMutation.isError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      Failed to change password. Please check your current password and try again.
                    </p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700"
                    disabled={updatePasswordMutation.isPending}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-purple-600" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Manage how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-600">Receive updates about your campaigns via email</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-5 w-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                    defaultChecked
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Collaboration Updates</p>
                    <p className="text-sm text-gray-600">Get notified when influencers respond to collaborations</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-5 w-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                    defaultChecked
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Weekly Reports</p>
                    <p className="text-sm text-gray-600">Receive weekly performance summaries</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-5 w-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button variant="outline" disabled>
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
