'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { adminService, type Registration } from '@/services/admin.service';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, XCircle, Clock, Building2, FileText, ChevronDown, ChevronUp,
  Loader2, ShieldAlert,
} from 'lucide-react';

type StatusFilter = 'pending' | 'approved' | 'rejected';

export default function LicensingPage() {
  const router = useRouter();
  const { isDirector } = useRoleAccess();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [approveRole, setApproveRole] = useState('client');

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminService.getRegistrations({ status: statusFilter, limit: 50 });
      if (response.success) {
        setRegistrations(response.data.registrations || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleApprove = async (registrationId: string) => {
    setActionLoading(registrationId);
    try {
      await adminService.approveRegistration(registrationId, approveRole);
      await fetchRegistrations();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to approve registration');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (registrationId: string) => {
    if (!rejectReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }
    setActionLoading(registrationId);
    try {
      await adminService.rejectRegistration(registrationId, rejectReason);
      setRejectingId(null);
      setRejectReason('');
      await fetchRegistrations();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reject registration');
    } finally {
      setActionLoading(null);
    }
  };

  // Redirect non-Directors
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
          <h1 className="text-2xl font-bold text-gray-900">Registration Approvals</h1>
          <p className="text-sm text-gray-500 mt-1">Review and approve pending user registrations</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Status filter tabs */}
        <div className="flex gap-2">
          {(['pending', 'approved', 'rejected'] as StatusFilter[]).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === 'pending' && <Clock className="h-4 w-4 mr-1" />}
              {status === 'approved' && <CheckCircle2 className="h-4 w-4 mr-1" />}
              {status === 'rejected' && <XCircle className="h-4 w-4 mr-1" />}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : registrations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No {statusFilter} registrations found.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {registrations.map((reg) => (
              <Card key={reg.id} className="overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedId(expandedId === reg.id ? null : reg.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{reg.companyName || 'No company name'}</p>
                      <p className="text-sm text-gray-500">{reg.user.email} — {reg.user.displayName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      reg.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      reg.status === 'approved' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {reg.status}
                    </span>
                    {expandedId === reg.id ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                  </div>
                </div>

                {expandedId === reg.id && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">License Number</span>
                        <p className="font-medium">{reg.licenseNumber || '—'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">VAT/TRN</span>
                        <p className="font-medium">{reg.vatTrnNumber || '—'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Expiry Date</span>
                        <p className="font-medium">{reg.expiryDate ? new Date(reg.expiryDate).toLocaleDateString() : '—'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Business Address</span>
                        <p className="font-medium">{reg.businessAddress || '—'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Activities</span>
                        <p className="font-medium">{reg.activities.length > 0 ? reg.activities.join(', ') : '—'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Owners</span>
                        <p className="font-medium">{reg.ownerNames.length > 0 ? reg.ownerNames.join(', ') : '—'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Phone</span>
                        <p className="font-medium">{reg.user.phone || '—'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Registered</span>
                        <p className="font-medium">{new Date(reg.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {reg.licenseFileUrl && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-indigo-600">
                        <FileText className="h-4 w-4" />
                        <span>Trade license uploaded</span>
                      </div>
                    )}

                    {/* Approve/Reject actions — only for pending */}
                    {reg.status === 'pending' && (
                      <div className="mt-4 space-y-3">
                        {/* Role selection for approval */}
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-500">Assign role on approval:</label>
                          <select
                            value={approveRole}
                            onChange={(e) => setApproveRole(e.target.value)}
                            className="text-sm border rounded px-2 py-1"
                          >
                            <option value="client">Client</option>
                            <option value="influencer">Influencer</option>
                            <option value="campaign_manager">Campaign Manager</option>
                            <option value="reviewer">Reviewer</option>
                            <option value="finance">Finance</option>
                          </select>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(reg.id)}
                            disabled={actionLoading === reg.id}
                          >
                            {actionLoading === reg.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <CheckCircle2 className="mr-1 h-3 w-3" />}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setRejectingId(rejectingId === reg.id ? null : reg.id)}
                            disabled={actionLoading === reg.id}
                          >
                            <XCircle className="mr-1 h-3 w-3" />
                            Reject
                          </Button>
                        </div>

                        {rejectingId === reg.id && (
                          <div className="flex gap-2">
                            <Input
                              placeholder="Rejection reason (required)"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(reg.id)}
                              disabled={actionLoading === reg.id || !rejectReason.trim()}
                            >
                              Confirm Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
