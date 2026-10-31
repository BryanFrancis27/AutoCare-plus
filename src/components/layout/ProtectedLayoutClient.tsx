'use client';

import { useState } from 'react';
import { NavigationGuardProvider } from './NavigationGuard';
import { MotionConfig } from 'framer-motion';
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
    <MotionConfig reducedMotion="user">
    <NavigationGuardProvider>
    <div className="min-h-screen bg-canvas text-ink">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <DashboardHeader
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        userName={userName}
        userEmail={userEmail}
      />
      
      {/* Mobile adjustment: keep content full-width while sidebar overlays on smaller screens */}
      <div className="flex pt-16 min-w-0">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main id="main-content" tabIndex={-1} className="flex-1 lg:ml-64 min-w-0">
          {children}
        </main>
      </div>
    </div>
    </NavigationGuardProvider>
    </MotionConfig>
  );
}
