import type { PropsWithChildren } from 'react';
import type React from 'react';
import { Navbar } from './components/Navbar/Navbar';

export const Shell: React.FC<PropsWithChildren> = ({ children }) => (
  <>
    <Navbar />
    {children}
  </>
);
