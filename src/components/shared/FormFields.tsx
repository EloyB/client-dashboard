'use client';

import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

function FieldShell({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-small text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-small text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

type BaseFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
};

export function TextField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  hint,
  required,
  className,
  ...inputProps
}: BaseFieldProps<TFieldValues> & Omit<React.ComponentProps<typeof Input>, 'name'>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <FieldShell
      label={label}
      htmlFor={name}
      required={required}
      hint={hint}
      error={fieldState.error?.message}
    >
      <Input
        id={name}
        aria-invalid={!!fieldState.error}
        className={className}
        {...field}
        {...inputProps}
      />
    </FieldShell>
  );
}

export function PasswordField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  hint,
  required,
  className,
  ...inputProps
}: BaseFieldProps<TFieldValues> & Omit<React.ComponentProps<typeof Input>, 'name' | 'type'>) {
  const { field, fieldState } = useController({ control, name });
  const [visible, setVisible] = useState(false);

  return (
    <FieldShell
      label={label}
      htmlFor={name}
      required={required}
      hint={hint}
      error={fieldState.error?.message}
    >
      <div className="relative">
        <Input
          id={name}
          type={visible ? 'text' : 'password'}
          aria-invalid={!!fieldState.error}
          className={cn('pr-16', className)}
          {...field}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="text-small text-primary absolute top-1/2 right-2.5 -translate-y-1/2 font-semibold"
        >
          {visible ? 'Verbergen' : 'Tonen'}
        </button>
      </div>
    </FieldShell>
  );
}

export function TextareaField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  hint,
  required,
  className,
  ...textareaProps
}: BaseFieldProps<TFieldValues> & Omit<React.ComponentProps<typeof Textarea>, 'name'>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <FieldShell
      label={label}
      htmlFor={name}
      required={required}
      hint={hint}
      error={fieldState.error?.message}
    >
      <Textarea
        id={name}
        aria-invalid={!!fieldState.error}
        className={className}
        {...field}
        {...textareaProps}
      />
    </FieldShell>
  );
}

export function SelectField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  hint,
  required,
  placeholder = 'Kies een optie',
  options,
}: BaseFieldProps<TFieldValues> & {
  placeholder?: string;
  options: { label: string; value: string }[];
}) {
  const { field, fieldState } = useController({ control, name });
  return (
    <FieldShell
      label={label}
      htmlFor={name}
      required={required}
      hint={hint}
      error={fieldState.error?.message}
    >
      <Select value={field.value ?? ''} onValueChange={field.onChange}>
        <SelectTrigger id={name} aria-invalid={!!fieldState.error} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  );
}

export function SwitchField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  hint,
}: BaseFieldProps<TFieldValues>) {
  const { field } = useController({ control, name });
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <Label htmlFor={name}>{label}</Label>
        {hint && <p className="text-small text-muted-foreground">{hint}</p>}
      </div>
      <Switch id={name} checked={field.value ?? false} onCheckedChange={field.onChange} />
    </div>
  );
}

export function CheckboxField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
}: Pick<BaseFieldProps<TFieldValues>, 'control' | 'name' | 'label'>) {
  const { field } = useController({ control, name });
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={name} checked={field.value ?? false} onCheckedChange={field.onChange} />
      <Label htmlFor={name} className="font-normal">
        {label}
      </Label>
    </div>
  );
}

export function DateField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  hint,
  required,
  placeholder = 'Kies een datum',
}: BaseFieldProps<TFieldValues> & { placeholder?: string }) {
  const { field, fieldState } = useController({ control, name });
  const selected: Date | undefined = field.value ?? undefined;

  return (
    <FieldShell
      label={label}
      htmlFor={name}
      required={required}
      hint={hint}
      error={fieldState.error?.message}
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={name}
            type="button"
            variant="outline"
            aria-invalid={!!fieldState.error}
            className={cn(
              'aria-invalid:border-destructive w-full justify-start font-normal',
              !selected && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="size-4" />
            {selected ? format(selected, 'd MMMM yyyy', { locale: nl }) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            locale={nl}
            selected={selected}
            onSelect={field.onChange}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </FieldShell>
  );
}

const timeOptions = Array.from({ length: 24 * 4 }, (_, index) => {
  const hours = String(Math.floor(index / 4)).padStart(2, '0');
  const minutes = String((index % 4) * 15).padStart(2, '0');
  return `${hours}:${minutes}`;
});

export function DateTimeField<TFieldValues extends FieldValues>({
  control,
  dateName,
  timeName,
  label,
  hint,
  required,
  allDayName,
}: {
  control: Control<TFieldValues>;
  dateName: FieldPath<TFieldValues>;
  timeName: FieldPath<TFieldValues>;
  label: string;
  hint?: string;
  required?: boolean;
  allDayName?: FieldPath<TFieldValues>;
}) {
  const allDayController = useController({ control, name: allDayName as FieldPath<TFieldValues> });
  const isAllDay = allDayName ? Boolean(allDayController.field.value) : false;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <DateField
            control={control}
            name={dateName}
            label={label}
            hint={hint}
            required={required}
          />
        </div>
        {!isAllDay && (
          <div className="w-28">
            <TimeSelectField control={control} name={timeName} />
          </div>
        )}
      </div>
    </div>
  );
}

function TimeSelectField<TFieldValues extends FieldValues>({
  control,
  name,
}: {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
}) {
  const { field } = useController({ control, name });
  return (
    <Select value={field.value ?? ''} onValueChange={field.onChange}>
      <SelectTrigger aria-label="Tijdstip">
        <SelectValue placeholder="Tijd" />
      </SelectTrigger>
      <SelectContent>
        {timeOptions.map((time) => (
          <SelectItem key={time} value={time}>
            {time}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
