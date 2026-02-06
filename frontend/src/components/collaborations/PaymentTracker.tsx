'use client';

import { DollarSign, Clock, CheckCircle } from 'lucide-react';
import type { PaymentStatus } from '@/types/collaboration.types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PaymentStatusBadge from './PaymentStatusBadge';
import { formatCurrency } from '@/lib/utils';

interface PaymentTrackerProps {
  agreedAmount?: number;
  paymentStatus: PaymentStatus;
  onUpdateStatus?: (status: PaymentStatus) => Promise<void>;
  canUpdateStatus?: boolean;
}

export default function PaymentTracker({
  agreedAmount = 0,
  paymentStatus,
  onUpdateStatus,
  canUpdateStatus = false,
}: PaymentTrackerProps) {
  const handleStatusUpdate = async (newStatus: PaymentStatus) => {
    if (!onUpdateStatus) return;
    try {
      await onUpdateStatus(newStatus);
    } catch (error) {
      console.error('Failed to update payment status:', error);
    }
  };

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-8 w-8 text-yellow-600" />;
      case 'processing':
        return <Clock className="h-8 w-8 text-blue-600 animate-spin" />;
      case 'paid':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Amount Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 mb-1">Agreed Amount</div>
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(agreedAmount)}
            </div>
          </div>
          <DollarSign className="h-12 w-12 text-gray-400" />
        </div>
      </Card>

      {/* Status Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Payment Status</h3>
          <PaymentStatusBadge status={paymentStatus} />
        </div>

        {/* Timeline */}
        <div className="space-y-4 mt-6">
          <div
            className={`flex items-center gap-3 ${
              paymentStatus === 'pending' ? 'opacity-100' : 'opacity-50'
            }`}
          >
            {getStatusIcon('pending')}
            <div>
              <div className="font-medium text-gray-900">Pending</div>
              <div className="text-sm text-gray-600">Payment not yet processed</div>
            </div>
          </div>

          <div
            className={`flex items-center gap-3 ${
              paymentStatus === 'processing' ? 'opacity-100' : 'opacity-50'
            }`}
          >
            {getStatusIcon('processing')}
            <div>
              <div className="font-medium text-gray-900">Processing</div>
              <div className="text-sm text-gray-600">Payment is being processed</div>
            </div>
          </div>

          <div
            className={`flex items-center gap-3 ${
              paymentStatus === 'paid' ? 'opacity-100' : 'opacity-50'
            }`}
          >
            {getStatusIcon('paid')}
            <div>
              <div className="font-medium text-gray-900">Paid</div>
              <div className="text-sm text-gray-600">Payment completed</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        {canUpdateStatus && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-3">Update Status</div>
            <div className="flex gap-2">
              {paymentStatus === 'pending' && (
                <Button
                  onClick={() => handleStatusUpdate('processing')}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Mark as Processing
                </Button>
              )}
              {paymentStatus === 'processing' && (
                <Button
                  onClick={() => handleStatusUpdate('paid')}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Mark as Paid
                </Button>
              )}
              {paymentStatus === 'paid' && (
                <div className="text-sm text-green-600 font-medium">
                  ✓ Payment completed
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
