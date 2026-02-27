'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { adminService, type AdminUser } from '@/services/admin.service';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import {
  Loader2, Search, ShieldAlert, Shield, UserCog, X, Check, Trash2, KeyRound,
} from 'lucide-react';

const ALL_ROLES = ['director', 'campaign_manager', 'reviewer', 'finance', 'client', 'influencer'] as const;
const INTERNAL_ROLES = ['director', 'campaign_manager', 'reviewer', 'finance'];
const EXTERNAL_ROLES = ['client', 'influencer'];

function RoleBadge({ role, onRemove }: { role: string; onRemove?: () => void }) {
  const colors: Record<string, string> = {
    director: 'bg-purple-100 text-purple-700',
    campaign_manager: 'bg-blue-100 text-blue-700',
    reviewer: 'bg-teal-100 text-teal-700',
    finance: 'bg-emerald-100 text-emerald-700',
    client: 'bg-orange-100 text-orange-700',
    influencer: 'bg-pink-100 text-pink-700',
  };

  const labels: Record<string, string> = {
    director: 'Director',
    campaign_manager: 'Campaign Mgr',
    reviewer: 'Reviewer',
    finance: 'Finance',
    client: 'Client',
    influencer: 'Influencer',
  };

  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${colors[role] || 'bg-gray-100 text-gray-700'}`}>
      {labels[role] || role}
      {onRemove && (
        <button onClick={onRemove} className="hover:opacity-70">
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

export default function RolesPage() {
  const { isDirector } = useRoleAccess();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminService.getUsers({ search: search || undefined, limit: 100 });
      if (response.success) {
        setUsers(response.data.users || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const debounce = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounce);
  }, [fetchUsers]);

  const handleAddRole = async (userId: string, role: string) => {
    setActionLoading(userId);
    setError('');
    setSuccessMsg('');
    try {
      await adminService.updateUserRoles(userId, { add: [role] });
      setSuccessMsg('Role added');
      await fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveRole = async (userId: string, role: string) => {
    setActionLoading(userId);
    setError('');
    setSuccessMsg('');
    try {
      await adminService.updateUserRoles(userId, { remove: [role] });
      setSuccessMsg('Role removed');
      await fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;
    setActionLoading(userId);
    setError('');
    try {
      await adminService.deleteUser(userId);
      setSuccessMsg('User deactivated');
      await fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendResetEmail = async (userId: string) => {
    setActionLoading(userId);
    try {
      await adminService.sendResetEmail(userId);
      setSuccessMsg('Password reset email sent');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send reset email');
    } finally {
      setActionLoading(null);
    }
  };

  if (!isDirector) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>Access denied. Only Directors can view this page.</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User & Role Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage user roles and account status</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {successMsg && (
          <Alert className="border-green-200 bg-green-50">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{successMsg}</AlertDescription>
          </Alert>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No users found.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {users.map((user) => {
              const isEditing = editingUser === user.id;
              const availableRoles = ALL_ROLES.filter((r) => !user.roles.includes(r));
              // Determine which roles can be added (enforce exclusivity)
              const hasExternal = user.roles.some((r) => EXTERNAL_ROLES.includes(r));
              const hasInternal = user.roles.some((r) => INTERNAL_ROLES.includes(r));

              const addableRoles = availableRoles.filter((r) => {
                if (EXTERNAL_ROLES.includes(r) && (hasInternal || (hasExternal && !user.roles.includes(r)))) return false;
                if (INTERNAL_ROLES.includes(r) && hasExternal) return false;
                return true;
              });

              return (
                <Card key={user.id}>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold ${user.isActive ? 'bg-purple-600' : 'bg-gray-400'}`}>
                          {user.displayName?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.displayName}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!user.isActive && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">Inactive</span>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingUser(isEditing ? null : user.id)}
                        >
                          <UserCog className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Roles */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {user.roles.length === 0 && (
                        <span className="text-xs text-gray-400">No roles assigned</span>
                      )}
                      {user.roles.map((role) => (
                        <RoleBadge
                          key={role}
                          role={role}
                          onRemove={isEditing ? () => handleRemoveRole(user.id, role) : undefined}
                        />
                      ))}
                    </div>

                    {/* Edit panel */}
                    {isEditing && (
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                        {/* Add role */}
                        {addableRoles.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Add role:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {addableRoles.map((role) => (
                                <Button
                                  key={role}
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAddRole(user.id, role)}
                                  disabled={actionLoading === user.id}
                                  className="text-xs h-7"
                                >
                                  + {role.replace('_', ' ')}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendResetEmail(user.id)}
                            disabled={actionLoading === user.id}
                          >
                            <KeyRound className="h-3 w-3 mr-1" />
                            Send Reset Email
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={actionLoading === user.id}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Deactivate
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
