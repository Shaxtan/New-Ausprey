import { useState } from 'react';
import { Card, CardHeader, Button } from '@/components/ui';
import { Bell } from 'lucide-react';
import { cn } from '@/utils';

const CHANNELS = ['Email', 'SMS', 'Push', 'In-App'];

// Row keys map to CHANNELS order: [Email, SMS, Push, In-App]
// This is local UI state only — not persisted to any backend yet.
const DEFAULT_PREFS = {
  'Geofence In/Out': [true, true, true, true],
  'Overspeed Alerts': [true, true, true, true],
  'Harsh Braking': [true, false, true, true],
  'Device Offline': [true, true, true, true],
  'Low Battery': [false, false, true, true],
  'Trip Start/End': [true, true, true, true],
};

export function NotificationPreferencesCard() {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);

  const toggle = (event, channelIdx) => {
    setPrefs((p) => {
      const row = [...p[event]];
      row[channelIdx] = !row[channelIdx];
      return { ...p, [event]: row };
    });
  };

  return (
    <Card>
      <CardHeader title="Notification Preferences" icon={Bell} />

      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left font-semibold text-slate-500 text-xs pb-2 px-1">&nbsp;</th>
              {CHANNELS.map((c) => (
                <th key={c} className="text-center font-semibold text-slate-500 text-xs pb-2 px-1">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {Object.entries(prefs).map(([event, row]) => (
              <tr key={event}>
                <td className="py-2.5 px-1 text-slate-700 font-medium whitespace-nowrap">{event}</td>
                {row.map((checked, i) => (
                  <td key={i} className="py-2.5 px-1 text-center">
                    <button
                      onClick={() => toggle(event, i)}
                      className={cn(
                        'w-4 h-4 rounded flex items-center justify-center transition mx-auto',
                        checked ? 'bg-primary' : 'bg-slate-200',
                      )}
                    >
                      {checked && (
                        <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 fill-white">
                          <path d="M4.5 8.5 2 6l-.9.9L4.5 10.3 11 3.8 10.1 2.9z" />
                        </svg>
                      )}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5">
        <Button>Save Preferences</Button>
      </div>
    </Card>
  );
}

export default NotificationPreferencesCard;