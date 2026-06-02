import { Input } from '@/components/ui';
import { FormField } from './FormField';

export function TextField({ label, hint, error, required, ...rest }) {
  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      <Input {...rest} />
    </FormField>
  );
}

export default TextField;
