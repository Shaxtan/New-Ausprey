import { useState } from 'react';
import { Card, CardHeader, Button } from '@/components/ui';
import { TextField, SelectField } from '@/components/forms';
import { Logo } from '@/layouts/components/Logo';
import { Settings } from 'lucide-react';

const TIMEZONES = ['(UTC+05:30) Asia/Kolkata', 'UTC', '(UTC-05:00) America/New_York', '(UTC+00:00) Europe/London'];
const DATE_FORMATS = ['DD-MMM-YYYY', 'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];
const CURRENCIES = ['INR (₹) - Indian Rupee', 'USD ($) - US Dollar', 'EUR (€) - Euro', 'GBP (£) - British Pound'];
const DISTANCE_UNITS = ['Kilometers (km)', 'Miles (mi)'];

export function CompanyProfileCard({ company }) {
  const [timezone, setTimezone] = useState(company?.timezone ?? TIMEZONES[0]);
  const [dateFormat, setDateFormat] = useState(company?.dateFormat ?? DATE_FORMATS[0]);
  const [currency, setCurrency] = useState(company?.currency ?? CURRENCIES[0]);
  const [distanceUnit, setDistanceUnit] = useState(company?.distanceUnit ?? DISTANCE_UNITS[0]);

  return (
    <Card>
      <CardHeader title="Company Profile" subtitle="Basic company information" icon={Settings} />

      <div className="mb-5">
        <TextField label="Company Name" defaultValue={company?.name ?? 'Ausprey Technologies Pvt. Ltd.'} />
      </div>

      <div className="mb-5">
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Logo</label>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-slate-200 px-4 py-2.5 bg-white">
            <Logo size={20} />
          </div>
          <Button variant="secondary" size="sm">Change</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <SelectField label="Time Zone" options={TIMEZONES} value={timezone} onChange={setTimezone} />
        <SelectField label="Date Format" options={DATE_FORMATS} value={dateFormat} onChange={setDateFormat} />
        <SelectField label="Currency" options={CURRENCIES} value={currency} onChange={setCurrency} />
        <SelectField label="Distance Unit" options={DISTANCE_UNITS} value={distanceUnit} onChange={setDistanceUnit} />
      </div>

      <div className="mt-6">
        <Button>Save Changes</Button>
      </div>
    </Card>
  );
}

export default CompanyProfileCard;