import { useState } from 'react';
import { Card, CardHeader, Button } from '@/components/ui';
import { SelectField } from '@/components/forms';
import { SlidersHorizontal } from 'lucide-react';
import { ToggleSwitch } from './ToggleSwitch';

const DASHBOARDS = ['Fleet Overview', 'Alert Dashboard', 'Analytics'];
const PAGE_SIZES = ['10', '25', '50', '100'];
const LANGUAGES = ['English', 'Hindi', 'Gujarati'];
const MAP_PROVIDERS = ['Google Maps', 'OpenStreetMap'];
const REFRESH_INTERVALS = ['15 sec', '30 sec', '60 sec', '5 min'];

export function SystemPreferencesCard() {
  const [defaultDashboard, setDefaultDashboard] = useState(DASHBOARDS[0]);
  const [pageSize, setPageSize] = useState('25');
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [mapProvider, setMapProvider] = useState(MAP_PROVIDERS[0]);
  const [darkMode, setDarkMode] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState('30 sec');
  const [betaFeatures, setBetaFeatures] = useState(false);

  return (
    <Card>
      <CardHeader title="System Preferences" icon={SlidersHorizontal} />

      <div className="space-y-4">
        <SelectField label="Default Dashboard" options={DASHBOARDS} value={defaultDashboard} onChange={setDefaultDashboard} />
        <SelectField label="Items per page" options={PAGE_SIZES} value={pageSize} onChange={setPageSize} />
        <SelectField label="Language" options={LANGUAGES} value={language} onChange={setLanguage} />
        <SelectField label="Map Provider" options={MAP_PROVIDERS} value={mapProvider} onChange={setMapProvider} />

        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-sm font-semibold text-slate-700">Enable Dark Mode</p>
            <p className="text-xs text-slate-400">Switch to dark theme</p>
          </div>
          <ToggleSwitch checked={darkMode} onChange={setDarkMode} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">Auto Refresh</p>
            <p className="text-xs text-slate-400">Auto-refresh dashboard data</p>
          </div>
          <SelectField
            options={REFRESH_INTERVALS}
            value={refreshInterval}
            onChange={setRefreshInterval}
            className="w-28"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">Show Beta Features</p>
            <p className="text-xs text-slate-400">Show upcoming features</p>
          </div>
          <ToggleSwitch checked={betaFeatures} onChange={setBetaFeatures} />
        </div>
      </div>

      <div className="mt-6">
        <Button>Save Changes</Button>
      </div>
    </Card>
  );
}

export default SystemPreferencesCard;