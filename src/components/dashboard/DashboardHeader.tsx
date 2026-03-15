'use client';

import { Menu } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';

interface DashboardHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  userName?: string;
  userEmail?: string;
}

export function DashboardHeader({ 
  sidebarOpen, 
  setSidebarOpen,
  userName,
  userEmail 
}: DashboardHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#1D1D1C] border-b border-[#3A3A3A] z-50">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="autocare-button lg:hidden p-2 rounded-lg transition-all duration-200 ease-out"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex items-center gap-0">
            <span className="text-xl font-semibold text-white">AutoCare</span>
            <span className="text-xl font-semibold text-[#D32F2F]">+</span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <NotificationDropdown />
          
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm text-white">{userName || 'User'}</span>
            <span className="text-xs text-[#B0B0B0]">{userEmail || 'user@example.com'}</span>
          </div>
          
          <div className="w-10 h-10 rounded-full bg-[#D32F2F] flex items-center justify-center">
            <span className="text-white font-semibold">
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
