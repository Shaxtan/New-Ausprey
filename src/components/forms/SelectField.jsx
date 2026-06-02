import { Select } from '@/components/ui';
import { FormField } from './FormField';

export function SelectField({ label, hint, error, required, options, value, onChange }) {
  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      <Select options={options} value={value} onChange={onChange} />
    </FormField>
  );
}

export default SelectField;
