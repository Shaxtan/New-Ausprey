import { Card, CardHeader, Button } from '@/components/ui';
import { MonitorCog } from 'lucide-react';

// All values below are static placeholders — replace with a real
// system-status endpoint (version, DB, backup, uptime) when available.
const SYSTEM_INFO = {
  version: 'v3.2.1',
  environment: 'Production',
  database: 'MongoDB 6.0',
  lastBackup: '18-May-2025 02:30 AM',
  lastBackupStatus: 'Success',
  serverTime: '18-May-2025 10:30 AM (UTC+05:30)',
  uptime: '15 Days, 6 Hours',
};

function InfoCell({ label, value, sub }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-bold text-slate-800">{value}</p>
      {sub && <p className="text-xs font-semibold text-emerald-600 mt-0.5">{sub}</p>}
    </div>
  );
}

export function SystemInfoCard() {
  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <CardHeader title="System Information" icon={MonitorCog} />
        <Button variant="secondary" size="sm">View System Logs</Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
        <InfoCell label="Version" value={SYSTEM_INFO.version} />
        <InfoCell label="Environment" value={SYSTEM_INFO.environment} />
        <InfoCell label="Database" value={SYSTEM_INFO.database} />
        <InfoCell label="Last Backup" value={SYSTEM_INFO.lastBackup} sub={SYSTEM_INFO.lastBackupStatus} />
        <InfoCell label="Server Time" value={SYSTEM_INFO.serverTime} />
        <InfoCell label="Uptime" value={SYSTEM_INFO.uptime} />
      </div>
    </Card>
  );
}

export default SystemInfoCard;