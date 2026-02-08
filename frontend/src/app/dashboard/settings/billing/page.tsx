'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Check, Zap, Building, Receipt } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'For individuals getting started',
    features: [
      'Up to 3 campaigns',
      '10 influencer searches/month',
      'Basic analytics',
      'Email support',
    ],
    current: true,
    cta: 'Current Plan',
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/month',
    description: 'For growing teams and agencies',
    features: [
      'Unlimited campaigns',
      'Unlimited influencer searches',
      'Advanced analytics & reports',
      'Team collaboration',
      'Priority support',
      'API access',
    ],
    current: false,
    cta: 'Upgrade',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations',
    features: [
      'Everything in Pro',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee',
      'SSO & advanced security',
      'Custom reporting',
    ],
    current: false,
    cta: 'Contact Sales',
  },
];

export default function BillingSettingsPage() {
  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="mt-1 text-gray-600">
            Manage your subscription plan and billing information
          </p>
        </div>

        {/* Current Plan */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Free Plan</h2>
                <p className="text-sm text-gray-600">You are currently on the Free plan</p>
              </div>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>
        </Card>

        {/* Plan Comparison */}
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`p-6 relative ${
                plan.popular ? 'border-2 border-purple-600 shadow-lg' : ''
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-600 text-white">
                  Most Popular
                </span>
              )}
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full ${
                  plan.current
                    ? ''
                    : plan.popular
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : ''
                }`}
                variant={plan.current ? 'outline' : 'default'}
                disabled={plan.current}
              >
                {plan.cta}
              </Button>
            </Card>
          ))}
        </div>

        {/* Billing History */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Billing History</h2>
              <p className="text-sm text-gray-600">View your past invoices and receipts</p>
            </div>
          </div>

          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No billing history</h3>
            <p className="text-sm text-gray-500">
              Your billing history will appear here once you upgrade to a paid plan.
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
