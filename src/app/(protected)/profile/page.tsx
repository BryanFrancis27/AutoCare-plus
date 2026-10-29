import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { User, Mail, Calendar, Shield, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    redirect('/login');
  }

  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'User';
  const email = user.email || '';
  const provider = user.app_metadata?.provider || 'email';

  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';

  const lastSignIn = user.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Unknown';

  const infoRows = [
    { icon: User, label: 'Full Name', value: fullName },
    { icon: Mail, label: 'Email Address', value: email },
    { icon: Calendar, label: 'Account Created', value: createdAt },
    { icon: Clock, label: 'Last Sign In', value: lastSignIn },
    {
      icon: Shield,
      label: 'Auth Provider',
      value: provider === 'google' ? 'Google OAuth' : 'Email & Password',
    },
  ];

  return (
    // Mobile adjustment: use compact spacing on phones and expand at larger breakpoints.
    <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 space-y-6">
      <PageHeader title="Profile" description="Your account information and details." />

      <div className="bg-containerBg rounded-xl border border-grayBorder p-4 sm:p-6">
        {/* Mobile adjustment: stack avatar and profile text for narrow viewports */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
          <div className="w-20 h-20 rounded-full bg-redPrimary flex items-center justify-center flex-shrink-0 shadow-lg">
            <span className="text-3xl font-bold text-onAccent">
              {fullName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-ink break-words">{fullName}</h2>
            <p className="text-textSecondary mt-1 break-words">{email}</p>
            <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-0.5 bg-redPrimary/20 text-redPrimary text-xs font-medium rounded-full">
              <Shield className="h-3 w-3" />
              {provider === 'google' ? 'Google Account' : 'Email Account'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-containerBg rounded-xl border border-grayBorder p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-ink mb-2">Account Information</h3>
        <div className="divide-y divide-grayBorder">
          {infoRows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 py-4">
              <div className="p-2.5 rounded-lg bg-redPrimary/20 flex-shrink-0">
                <Icon className="h-5 w-5 text-redPrimary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-textSecondary uppercase tracking-wide">
                  {label}
                </p>
                <p className="text-sm font-semibold text-ink mt-0.5 break-words">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
