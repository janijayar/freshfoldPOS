import type { Metadata } from 'next';
import { Providers } from '@/providers';

export const metadata: Metadata = {
  title: 'freshfold — POS & Management',
  description: 'Point of Sale and management platform for freshfold',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Providers>{children}</Providers>;
}