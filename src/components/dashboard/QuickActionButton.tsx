'use client';

import Link from 'next/link';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';

interface QuickActionButtonProps {
  label: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
}
export function QuickActionButton({ label, description, icon: Icon, href, onClick }: QuickActionButtonProps) {
  const content = <>
    <span className="rounded-lg bg-accentSoft p-2.5 text-accent"><Icon className="h-5 w-5" aria-hidden="true" /></span>
    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-ink">{label}</span><span className="mt-0.5 block text-sm leading-5 text-muted">{description}</span></span>
    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
  </>;
  const className = 'flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-left transition-colors hover:border-accent/30 hover:bg-canvas';
  return href ? <Link href={href} className={className}>{content}</Link> : <button type="button" onClick={onClick} className={className}>{content}</button>;
}
