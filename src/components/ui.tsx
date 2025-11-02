import clsx from 'clsx';
import { ReactNode } from 'react';

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      {description && <p className="text-sm text-slate-600">{description}</p>}
    </header>
  );
}

export function Card({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {actions}
      </div>
      <div className="space-y-4 text-sm text-slate-700">{children}</div>
    </section>
  );
}

export function Badge({ children, variant = 'default' }: { children: ReactNode; variant?: 'default' | 'consultant' | 'client' | 'mentor' }) {
  const variantClasses: Record<string, string> = {
    default: 'bg-slate-100 text-slate-700',
    consultant: 'bg-brand-100 text-brand-700',
    client: 'bg-emerald-100 text-emerald-700',
    mentor: 'bg-violet-100 text-violet-700'
  };
  return <span className={clsx('rounded-full px-2 py-1 text-xs font-medium', variantClasses[variant])}>{children}</span>;
}

export function Divider() {
  return <div className="h-px bg-slate-200" />;
}

export function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-800">
      <span>{label}</span>
      {hint && <span className="text-xs font-normal text-slate-500">{hint}</span>}
    </label>
  );
}

export function Button({
  children,
  variant = 'primary',
  type = 'button',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary'; type?: 'button' | 'submit' }) {
  return (
    <button
      type={type}
      {...props}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        variant === 'primary'
          ? 'border-brand-600 bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-600'
          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-slate-400',
        props.className
      )}
    >
      {children}
    </button>
  );
}

export function TextArea({ label, hint, ...props }: { label: string; hint?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="space-y-1">
      <FieldLabel label={label} hint={hint} />
      <textarea
        {...props}
        className={clsx(
          'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200',
          props.className
        )}
      />
    </div>
  );
}

export function TextInput({ label, hint, ...props }: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1">
      <FieldLabel label={label} hint={hint} />
      <input
        {...props}
        className={clsx(
          'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200',
          props.className
        )}
      />
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
      <h3 className="text-base font-medium text-slate-900">{title}</h3>
      {description && <p className="mt-2 text-sm text-slate-600">{description}</p>}
    </div>
  );
}
