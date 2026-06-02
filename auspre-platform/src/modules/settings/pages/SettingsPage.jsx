import { useState } from 'react';
import { PageHeader } from '@/components/common';
import { Tabs, PageLoader } from '@/components/ui';
import { useSettings } from '../hooks/useSettings';
import { ProfileSettings } from '../components/ProfileSettings';
import { NotificationSettings } from '../components/NotificationSettings';
import { SecuritySettings } from '../components/SecuritySettings';

const TABS = [
  { value: 'profile', label: 'Profile' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'security', label: 'Security' },
];

export default function SettingsPage() {
  const { data, isLoading } = useSettings();
  const [tab, setTab] = useState('profile');

  return (
    <div>
      <PageHeader crumbs={['Administration', 'Settings']} title="Settings" description="Manage your account, notifications and security preferences." />
      <Tabs tabs={TABS} value={tab} onChange={setTab} className="mb-5" />
      {isLoading ? <PageLoader /> : (
        <div className="max-w-3xl">
          {tab === 'profile' && <ProfileSettings profile={data?.profile} />}
          {tab === 'notifications' && <NotificationSettings notifications={data?.notifications} />}
          {tab === 'security' && <SecuritySettings security={data?.security} />}
        </div>
      )}
    </div>
  );
}
