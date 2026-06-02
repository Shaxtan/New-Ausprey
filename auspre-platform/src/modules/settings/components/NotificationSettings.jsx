import { useState } from 'react';
import { Card, CardHeader, Button } from '@/components/ui';
import { Toggle } from '@/components/forms';

const FIELDS = [
  ['overspeed', 'Overspeed Alerts', 'Notify when a vehicle exceeds the limit'],
  ['geofence', 'Geofence Alerts', 'Entry / exit notifications'],
  ['maintenance', 'Maintenance Reminders', 'Service due notifications'],
  ['weeklyReport', 'Weekly Summary', 'Email digest every Monday'],
  ['sms', 'SMS Notifications', 'Send critical alerts over SMS'],
];

export function NotificationSettings({ notifications = {} }) {
  const [state, setState] = useState(notifications);
  const set = (k) => (v) => setState((s) => ({ ...s, [k]: v }));
  return (
    <Card>
      <CardHeader title="Notifications" subtitle="Choose what you want to be notified about" />
      <div className="space-y-4">
        {FIELDS.map(([k, label, desc]) => (
          <div key={k} className="pb-4 border-b border-slate-50 last:border-0 last:pb-0">
            <Toggle label={label} description={desc} checked={!!state[k]} onChange={set(k)} />
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-6"><Button>Save Preferences</Button></div>
    </Card>
  );
}

export default NotificationSettings;
