import { useState } from 'react';
import { Button, Modal } from '@/components/ui';
import { TextField, SelectField, Toggle } from '@/components/forms';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#0ea5e9', '#f43f5e'];

export function AddGeofenceForm({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({ name: '', type: 'In/Out', color: COLORS[0], entry: true, exit: true });
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal
      open={open} onClose={onClose} title="Add Geofence" description="Create a zone and configure entry/exit alerts."
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={() => { onSubmit?.(form); onClose(); }}>Save Geofence</Button>
      </>}
    >
      <div className="space-y-4">
        <TextField label="Name" required placeholder="e.g. Warehouse Zone" value={form.name} onChange={(e) => set('name')(e.target.value)} />
        <SelectField label="Type" options={['In/Out', 'In', 'Out']} value={form.type} onChange={set('type')} />
        <div>
          <span className="block text-xs font-semibold text-slate-600 mb-2">Color</span>
          <div className="flex items-center gap-2">
            {COLORS.map((c) => (
              <button key={c} onClick={() => set('color')(c)}
                className="w-7 h-7 rounded-full transition" style={{ backgroundColor: c, outline: form.color === c ? '2px solid #0f172a' : 'none', outlineOffset: 2 }} />
            ))}
          </div>
        </div>
        <div className="space-y-3 pt-1">
          <Toggle label="Entry Alert" description="Notify when a vehicle enters" checked={form.entry} onChange={set('entry')} />
          <Toggle label="Exit Alert" description="Notify when a vehicle leaves" checked={form.exit} onChange={set('exit')} />
        </div>
      </div>
    </Modal>
  );
}

export default AddGeofenceForm;
