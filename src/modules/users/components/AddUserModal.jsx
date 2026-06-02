import { useState } from 'react';
import { Button, Modal } from '@/components/ui';
import { TextField, SelectField, Toggle } from '@/components/forms';

export function AddUserModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'Viewer', dept: 'Operations', active: true });
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal
      open={open} onClose={onClose} title="Add User" description="Invite a new team member and assign a role." size="lg"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={() => { onSubmit?.(form); onClose(); }}>Create User</Button>
      </>}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField label="Full Name" required placeholder="Jane Doe" value={form.name} onChange={(e) => set('name')(e.target.value)} />
        <TextField label="Email" required type="email" placeholder="jane@auspre.com" value={form.email} onChange={(e) => set('email')(e.target.value)} />
        <SelectField label="Role" options={['Super Admin', 'Fleet Manager', 'Operations', 'Driver', 'Maintenance', 'Viewer']} value={form.role} onChange={set('role')} />
        <SelectField label="Department" options={['Administration', 'Operations', 'Logistics', 'Maintenance']} value={form.dept} onChange={set('dept')} />
        <div className="sm:col-span-2 pt-1">
          <Toggle label="Active on creation" description="User can log in immediately" checked={form.active} onChange={set('active')} />
        </div>
      </div>
    </Modal>
  );
}

export default AddUserModal;
