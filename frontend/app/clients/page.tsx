'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Client } from '@/types';
import { isCampaignManagerOrHigher } from '@/utils/rbac';

export default function ClientsPage() {
  return (
    <ProtectedRoute>
      <ClientsContent />
    </ProtectedRoute>
  );
}

function ClientsContent() {
  const router = useRouter();
  const { profile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const canManageClients = profile && isCampaignManagerOrHigher(profile.role);

  useEffect(() => {
    fetchClients();
  }, [showInactive]);

  async function fetchClients() {
    try {
      let query = supabase
        .from('clients')
        .select('*')
        .order('name');

      if (!showInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      console.error('Error fetching clients:', error.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredClients = clients.filter(client => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      client.name.toLowerCase().includes(term) ||
      client.client_code.toLowerCase().includes(term) ||
      client.company_name?.toLowerCase().includes(term) ||
      client.email?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
            <p className="text-gray-600 mt-1">Manage your client database</p>
          </div>
          {canManageClients && (
            <button
              onClick={() => router.push('/clients/new')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              + New Client
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <input
                type="text"
                placeholder="Search by name, code, company, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Show inactive</span>
            </label>
          </div>
        </div>

        {/* Clients Grid */}
        {filteredClients.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">
              {searchTerm
                ? 'No clients match your search.'
                : 'No clients yet. Add your first client to get started.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                onClick={() => canManageClients && router.push(`/clients/${client.id}`)}
                className={`bg-white rounded-lg shadow p-6 ${
                  canManageClients ? 'hover:shadow-lg transition cursor-pointer' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {client.name}
                      </h3>
                      <span className="text-sm font-mono text-gray-500">
                        {client.client_code}
                      </span>
                      {!client.is_active && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          Inactive
                        </span>
                      )}
                    </div>

                    {client.company_name && (
                      <p className="text-gray-600 mb-2">{client.company_name}</p>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      {client.email && (
                        <div>
                          <span className="font-medium">Email:</span> {client.email}
                        </div>
                      )}
                      {client.phone && (
                        <div>
                          <span className="font-medium">Phone:</span> {client.phone}
                        </div>
                      )}
                      {client.industry && (
                        <div>
                          <span className="font-medium">Industry:</span> {client.industry}
                        </div>
                      )}
                      {client.city && (
                        <div>
                          <span className="font-medium">Location:</span>{' '}
                          {client.city}
                          {client.country && `, ${client.country}`}
                        </div>
                      )}
                    </div>

                    {client.notes && (
                      <p className="text-gray-600 mt-3 text-sm line-clamp-2">
                        {client.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
