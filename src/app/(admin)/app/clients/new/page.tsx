import { ClientForm } from '../ClientForm';

export default function NewClientPage() {
  return (
    <ClientForm
      defaultValues={{ name: '', email: '', vatNumber: '', phone: '', address: '', notes: '' }}
    />
  );
}
