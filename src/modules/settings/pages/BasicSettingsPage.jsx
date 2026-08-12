import { ProfileSettings } from '../components/ProfileSettings';
import { SystemPreferencesCard } from '../components/SystemPreferencesCard';

/**
 * Settings shown to any authenticated user who is NOT Super Admin or
 * Administrator — personal profile + personal display preferences only.
 *
 * Deliberately excludes the company-wide admin controls (Company Profile,
 * org-wide Notification routing, User & Role management, Device & Data
 * settings, Security policy, System Info) — those stay behind the full
 * admin console rendered for Super Admin / Administrator in
 * SettingsPage.jsx.
 */
export function BasicSettingsPage({ profile }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
      <ProfileSettings profile={profile} />
      <SystemPreferencesCard />
    </div>
  );
}

export default BasicSettingsPage;