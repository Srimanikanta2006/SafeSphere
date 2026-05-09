import { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-full bg-slate-50 overflow-hidden">
      {children}
    </div>
  );
}
