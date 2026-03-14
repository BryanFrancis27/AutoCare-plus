'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout';
import { DashboardHeader } from '@/components/dashboard';

interface ProtectedLayoutClientProps {
  children: React.ReactNode;
  userName?: string;
  userEmail?: string;
}

export function ProtectedLayoutClient({ children, userName, userEmail }: ProtectedLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-darkBg">
      <DashboardHeader
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        userName={userName}
        userEmail={userEmail}
      />
      
      <div className="flex pt-16">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 lg:ml-64">
          {children}
        </main>
      </div>
    </div>
  );
}
