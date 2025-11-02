'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Transition } from '@headlessui/react';
import { CheckCircleIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export type ToastVariant = 'success' | 'error';

type Toast = {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  showToast: (toast: Omit<Toast, 'id'>) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    setToasts((prev) => [...prev, { ...toast, id: Date.now() }]);
    setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 4500);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 flex w-80 flex-col gap-3">
        {toasts.map((toast) => (
          <Transition
            key={toast.id}
            show
            enter="transition ease-out duration-200"
            enterFrom="translate-y-2 opacity-0"
            enterTo="translate-y-0 opacity-100"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div
              className={`flex items-start gap-3 rounded-lg border bg-white p-4 shadow-lg ${
                toast.variant === 'success' ? 'border-emerald-200' : 'border-rose-200'
              }`}
            >
              {toast.variant === 'success' ? (
                <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-rose-500" />
              )}
              <div className="flex-1 text-sm">
                <p className="font-medium text-slate-900">{toast.title}</p>
                {toast.description && <p className="text-slate-600">{toast.description}</p>}
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-slate-400 hover:text-slate-600"
                aria-label="close toast"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </Transition>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
