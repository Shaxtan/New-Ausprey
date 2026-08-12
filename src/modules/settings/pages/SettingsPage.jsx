import { useState } from 'react';
import { PageHeader } from '@/components/common';
import { Tabs } from '@/components/ui';
import { Users, HardDrive, ShieldCheck } from 'lucide-react';
import { CompanyProfileCard } from '../components/CompanyProfileCard';
import { SystemPreferencesCard } from '../components/SystemPreferencesCard';
import { NotificationPreferencesCard } from '../components/NotificationPreferencesCard';
import { QuickLinkSummaryCard } from '../components/QuickLinkSummaryCard';
import { SystemInfoCard } from '../components/SystemInfoCard';

const TABS = [
  { value: 'general', label: 'General' },
  { value: 'organization', label: 'Organization' },
  { value: 'users', label: 'Users & Roles' },
  { value: 'devices', label: 'Devices' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'integrations', label: 'Integrations' },
  { value: 'data', label: 'Data & Reports' },
  { value: 'security', label: 'Security' },
  { value: 'system', label: 'System' },
];

function ComingSoon({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs mt-1">This section isn't built yet.</p>
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState('general');

  return (
    <div className="pb-10">
      <PageHeader
        crumbs={['Home', 'Settings']}
        title="Settings"
        description="Manage system configuration and preferences"
      />

      <div className="mb-6 border-b border-slate-100">
        <Tabs value={tab} onChange={setTab} tabs={TABS} />
      </div>

      {tab === 'general' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <CompanyProfileCard />
            <SystemPreferencesCard />
            <NotificationPreferencesCard />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <QuickLinkSummaryCard
              icon={Users}
              title="User & Role Settings"
              rows={[
                { label: 'Users', sub: 'Add, edit and manage system users', value: '156' },
                { label: 'Roles & Permissions', sub: 'Manage roles and their permissions', value: '12' },
                { label: 'User Groups', sub: 'Organize users into groups', value: '8' },
              ]}
              actionLabel="Manage Users & Roles"
            />
            <QuickLinkSummaryCard
              icon={HardDrive}
              title="Device & Data Settings"
              rows={[
                { label: 'Device Templates', sub: 'Manage device types and templates', value: '15' },
                { label: 'Data Retention', sub: 'Configure data retention policies', value: '180 Days' },
                { label: 'Data Upload Interval', sub: 'Set default data upload interval', value: '30 sec' },
                { label: 'Odometer Update Interval', sub: 'Set odometer update frequency', value: '60 sec' },
              ]}
              actionLabel="Manage Devices & Data"
            />
            <QuickLinkSummaryCard
              icon={ShieldCheck}
              title="Security Settings"
              rows={[
                { label: 'Two-Factor Authentication (2FA)', sub: 'Require 2FA for all users', value: 'On', valueClassName: 'text-xs font-bold text-primary', chevron: false },
                { label: 'Password Policy', sub: 'Minimum 8 characters with complexity', value: 'Configured', valueClassName: 'text-xs font-bold text-emerald-600' },
                { label: 'Session Timeout', sub: 'Auto-logout after inactivity', value: '30 Minutes' },
                { label: 'Login Attempt Limit', sub: 'Max failed attempts before lockout', value: '5 Attempts' },
              ]}
              actionLabel="Manage Security"
            />
          </div>

          <SystemInfoCard />
        </div>
      )}

      {tab === 'organization' && <ComingSoon label="Organization" />}
      {tab === 'users' && <ComingSoon label="Users & Roles" />}
      {tab === 'devices' && <ComingSoon label="Devices" />}
      {tab === 'notifications' && <ComingSoon label="Notifications" />}
      {tab === 'integrations' && <ComingSoon label="Integrations" />}
      {tab === 'data' && <ComingSoon label="Data & Reports" />}
      {tab === 'security' && <ComingSoon label="Security" />}
      {tab === 'system' && <ComingSoon label="System" />}
    </div>
  );
}