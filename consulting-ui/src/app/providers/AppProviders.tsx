import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryProvider } from './QueryProvider';
import { ThemeModeProvider } from './ThemeModeProvider';
import { AuthProvider } from '@/features/auth';
import { AccessProvider } from '@/features/access';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ThemeModeProvider>
        <BrowserRouter>
          <AuthProvider>
            <AccessProvider>{children}</AccessProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeModeProvider>
    </QueryProvider>
  );
}
