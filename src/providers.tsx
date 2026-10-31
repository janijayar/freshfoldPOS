'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode, useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@radix-ui/react-tooltip';

function ClientToaster() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <Toaster position="top-right" />;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <TooltipProvider>
        {children}
        <ClientToaster />
      </TooltipProvider>
    </SessionProvider>
  );
}