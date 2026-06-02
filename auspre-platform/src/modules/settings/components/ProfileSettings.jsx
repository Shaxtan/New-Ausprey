import { Card, CardHeader, Button, Avatar } from '@/components/ui';
import { TextField, SelectField } from '@/components/forms';

export function ProfileSettings({ profile }) {
  return (
    <Card>
      <CardHeader title="Profile" subtitle="Update your personal information" />
      <div className="flex items-center gap-4 mb-6">
        <Avatar name={profile?.name ?? 'Admin User'} size={64} />
        <div>
          <Button variant="secondary" size="sm">Change Photo</Button>
          <p className="text-xs text-slate-400 mt-1.5">JPG or PNG. Max 2MB.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField label="Full Name" defaultValue={profile?.name} />
        <TextField label="Email" type="email" defaultValue={profile?.email} />
        <TextField label="Phone" defaultValue={profile?.phone} />
        <SelectField label="Timezone" options={['Asia/Kolkata', 'UTC', 'America/New_York', 'Europe/London']} value={profile?.timezone ?? 'Asia/Kolkata'} onChange={() => {}} />
      </div>
      <div className="flex justify-end mt-6"><Button>Save Changes</Button></div>
    </Card>
  );
}

export default ProfileSettings;
