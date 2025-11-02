import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ToastProvider } from '@/components/toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SAP Consultant OJT Simulator',
  description: 'Hands-on simulator for SAP SD consultants in training.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full bg-slate-50">
      <body className={`${inter.className} min-h-screen`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
