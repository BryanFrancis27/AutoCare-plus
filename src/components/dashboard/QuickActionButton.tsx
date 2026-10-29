'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface QuickActionButtonProps {
  label: string;
  icon: LucideIcon;
  href: string;
  iconBgColor: string;
  onClick?: () => void;
}

export function QuickActionButton({ 
  label, 
  icon: Icon, 
  href, 
  iconBgColor,
  onClick 
}: QuickActionButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className="flex items-center gap-3 p-4 bg-darkBg hover:bg-surfaceHover rounded-lg transition-colors group"
    >
      <div className="p-2 rounded-lg bg-redPrimary group-hover:scale-110 transition-transform">
        <Icon className="h-5 w-5 text-onAccent" />
      </div>
      <span className="text-sm font-medium text-ink">{label}</span>
    </Link>
  );
}
