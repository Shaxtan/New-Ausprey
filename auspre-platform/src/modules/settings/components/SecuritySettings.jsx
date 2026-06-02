import { useState } from 'react';
import { Card, CardHeader, Button } from '@/components/ui';
import { SelectField, Toggle } from '@/components/forms';

export function SecuritySettings({ security = {} }) {
  const [state, setState] = useState(security);
  const set = (k) => (v) => setState((s) => ({ ...s, [k]: v }));
  return (
    <Card>
      <CardHeader title="Security" subtitle="Protect your account" />
      <div className="space-y-5">
        <Toggle label="Two-Factor Authentication" description="Require a code at login" checked={!!state.twoFactor} onChange={set('twoFactor')} />
        <Toggle label="Login Alerts" description="Email me on new device sign-ins" checked={!!state.loginAlerts} onChange={set('loginAlerts')} />
        <SelectField label="Session Timeout" options={['15 minutes', '30 minutes', '1 hour', '4 hours']} value={state.sessionTimeout ?? '30 minutes'} onChange={set('sessionTimeout')} />
      </div>
      <div className="flex justify-end mt-6 gap-2.5">
        <Button variant="secondary">Reset Password</Button>
        <Button>Save</Button>
      </div>
    </Card>
  );
}

export default SecuritySettings;
