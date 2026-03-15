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
      
      {/* Mobile adjustment: keep content full-width while sidebar overlays on smaller screens */}
      <div className="flex pt-16 min-w-0">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 lg:ml-64 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
