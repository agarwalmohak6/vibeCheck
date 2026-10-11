import type { Metadata } from 'next';
import AdminDashboard from '@/components/AdminDashboard';
import { getConfiguredAdminEmail } from '@/services/server/admin-auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'VibeCheck Admin - Payment control room',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return <AdminDashboard configuredAdminEmail={getConfiguredAdminEmail()} />;
}
