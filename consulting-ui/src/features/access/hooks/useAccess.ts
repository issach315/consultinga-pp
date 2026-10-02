import { useContext } from 'react';
import { AccessContext } from '../context/accessContextInstance';

export function useAccess() {
  const context = useContext(AccessContext);
  if (!context) {
    throw new Error('useAccess must be used within an AccessProvider');
  }
  return context;
}
