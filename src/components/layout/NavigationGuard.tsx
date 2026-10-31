'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo, useRef, type ComponentProps, type ReactNode } from 'react';

type Navigation = () => void;
type Guard = (navigate: Navigation) => void;
const NavigationContext = createContext({
  request: (navigate: Navigation) => navigate(),
  register: (_guard: Guard): (() => void) => () => {},
});

// Explicit application controls opt in. No document click or history interception.
export function NavigationGuardProvider({ children }: { children: ReactNode }) {
  const guard = useRef<Guard | null>(null);
  const request = useCallback((navigate: Navigation) => { if (guard.current) guard.current(navigate); else navigate(); }, []);
  const register = useCallback((next: Guard) => {
    guard.current = next;
    return () => { if (guard.current === next) guard.current = null; };
  }, []);
  const value = useMemo(() => ({ request, register }), [request, register]);
  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}
export function useNavigationGuard() { return useContext(NavigationContext); }

type LinkProps = Omit<ComponentProps<typeof Link>, 'href' | 'onClick'> & { href: string; onNavigate?: () => void };
export function GuardedLink({ href, onNavigate, ...props }: LinkProps) {
  const router = useRouter();
  const navigation = useNavigationGuard();
  return <Link {...props} href={href} onClick={event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target === '_blank') return;
    event.preventDefault();
    navigation.request(() => { onNavigate?.(); router.push(href); });
  }} />;
}
