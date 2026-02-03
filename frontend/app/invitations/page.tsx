'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import ProtectedRoute from '@/components/ProtectedRoute';
import { isDirector, getRoleDisplayName } from '@/utils/rbac';
import { Invitation, UserRole } from '@/types';

export default function InvitationsPage() {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('campaign_manager');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (profile && !isDirector(profile)) {
      router.push('/dashboard');
    }
    fetchInvitations();
  }, [profile]);

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (err) {
      console.error('Error fetching invitations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      // Generate invite code
      const inviteCode = await generateInviteCode();

      // Set expiration (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error } = await supabase.from('invitations').insert({
        email: email.toLowerCase(),
        role,
        invite_code: inviteCode,
        invited_by: profile?.id,
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;

      setSuccess(`Invitation sent to ${email} with code: ${inviteCode}`);
      setEmail('');
      setRole('campaign_manager');
      setShowForm(false);
      fetchInvitations();
    } catch (err: any) {
      setError(err.message || 'Failed to create invitation');
    } finally {
      setSubmitting(false);
    }
  };

  const generateInviteCode = async (): Promise<string> => {
    let code = '';
    let unique = false;

    while (!unique) {
      // Generate 8-character code
      code = Math.random().toString(36).substring(2, 10).toUpperCase();

      // Check if code exists
      const { data } = await supabase
        .from('invitations')
        .select('id')
        .eq('invite_code', code)
        .single();

      if (!data) {
        unique = true;
      }
    }

    return code;
  };

  const revokeInvitation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'revoked' })
        .eq('id', id);

      if (error) throw error;
      fetchInvitations();
    } catch (err) {
      console.error('Error revoking invitation:', err);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-purple-600">TiKiT</h1>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    href="/dashboard"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/invitations"
                    className="border-purple-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Invitations
                  </Link>
                  <Link
                    href="/profile"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Profile
                  </Link>
                </div>
              </div>
              <div className="flex items-center">
                <button
                  onClick={handleSignOut}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="md:flex md:items-center md:justify-between mb-8">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  Invitations
                </h2>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                >
                  + New Invitation
                </button>
              </div>
            </div>

            {/* Success/Error messages */}
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-md bg-green-50 p-4">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}

            {/* Create Invitation Form */}
            {showForm && (
              <div className="mb-6 bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Create New Invitation
                  </h3>
                  <form onSubmit={handleCreateInvitation} className="mt-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <input
                          type="email"
                          id="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                          Role
                        </label>
                        <select
                          id="role"
                          value={role}
                          onChange={(e) => setRole(e.target.value as UserRole)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        >
                          <option value="director">Director (Super-user)</option>
                          <option value="campaign_manager">Campaign Manager</option>
                          <option value="reviewer">Reviewer</option>
                          <option value="finance">Finance</option>
                          <option value="influencer">Influencer</option>
                          <option value="client">Client</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                      >
                        {submitting ? 'Creating...' : 'Send Invitation'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Invitations List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {loading ? (
                  <li className="px-4 py-4 sm:px-6 text-center text-gray-500">Loading...</li>
                ) : invitations.length === 0 ? (
                  <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                    No invitations yet. Create one to get started!
                  </li>
                ) : (
                  invitations.map((invitation) => (
                    <li key={invitation.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-purple-600 truncate">
                              {invitation.email}
                            </p>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              <span className="truncate">
                                Code: <span className="font-mono font-bold">{invitation.invite_code}</span>
                              </span>
                              <span className="mx-2">•</span>
                              <span>{getRoleDisplayName(invitation.role)}</span>
                              <span className="mx-2">•</span>
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  invitation.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : invitation.status === 'accepted'
                                    ? 'bg-green-100 text-green-800'
                                    : invitation.status === 'expired'
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {invitation.status}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                              Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                            </p>
                          </div>
                          {invitation.status === 'pending' && (
                            <button
                              onClick={() => revokeInvitation(invitation.id)}
                              className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
