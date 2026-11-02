'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Store,
  CreditCard,
  HardDrive,
  Users,
  Shield,
  Receipt,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

const settingsSections = [
  {
    key: 'organization',
    title: 'Organization',
    description: 'Business details, branding, and organization-wide settings',
    icon: Building2,
    iconColor: 'bg-blue-500',
    href: '/settings/organization',
  },
  {
    key: 'locations',
    title: 'Locations',
    description: 'Manage store locations, addresses, and location-specific settings',
    icon: Store,
    iconColor: 'bg-green-500',
    href: '/settings/locations',
  },
  {
    key: 'register',
    title: 'Registers',
    description: 'Configure POS registers, hardware, and device settings',
    icon: HardDrive,
    iconColor: 'bg-purple-500',
    href: '/settings/register',
  },
  {
    key: 'payments',
    title: 'Payments',
    description: 'Payment providers, Stripe Terminal, and payment methods',
    icon: CreditCard,
    iconColor: 'bg-orange-500',
    href: '/settings/payments',
  },
  {
    key: 'tax',
    title: 'Tax',
    description: 'Tax rates, rules, and jurisdiction configuration',
    icon: Receipt,
    iconColor: 'bg-teal-500',
    href: '/settings/tax',
  },
  {
    key: 'users',
    title: 'Users & Roles',
    description: 'Staff accounts, permissions, and role management',
    icon: Users,
    iconColor: 'bg-indigo-500',
    href: '/settings/users',
  },
];

function SettingsPageInner() {
  const router = useRouter();

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
        <div>
          <h1 className="text-xl font-bold">Settings</h1>
          <p className="text-sm text-text-muted mt-1">Manage your account and business configuration</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {settingsSections.map((section) => (
              <Card
                key={section.key}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(section.href)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={cn('p-3 rounded-lg', section.iconColor)}>
                      <section.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <CardDescription className="mt-1">{section.description}</CardDescription>
                    </div>
                    <ChevronRight className="h-5 w-5 text-text-muted mt-1 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>System</CardTitle>
                <CardDescription>Advanced configuration and security</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col items-start gap-2 justify-start"
                    onClick={() => router.push('/settings/organization')}
                  >
                    <Settings className="h-6 w-6" />
                    <span className="font-medium">General Settings</span>
                    <span className="text-sm text-text-muted">App preferences & defaults</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col items-start gap-2 justify-start"
                    onClick={() => alert('Security settings coming soon')}
                  >
                    <Shield className="h-6 w-6" />
                    <span className="font-medium">Security</span>
                    <span className="text-sm text-text-muted">MFA, sessions, audit logs</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col items-start gap-2 justify-start"
                    onClick={() => alert('Integrations coming soon')}
                  >
                    <HardDrive className="h-6 w-6" />
                    <span className="font-medium">Integrations</span>
                    <span className="text-sm text-text-muted">Third-party connections</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col items-start gap-2 justify-start"
                    onClick={() => alert('Billing coming soon')}
                  >
                    <CreditCard className="h-6 w-6" />
                    <span className="font-medium">Billing</span>
                    <span className="text-sm text-text-muted">Subscription & invoices</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPageWrapper() {
  return (
    <PermissionGuard permission="settings" action="view">
      <SettingsPageInner />
    </PermissionGuard>
  );
}