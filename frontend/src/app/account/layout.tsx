import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Account | Suki Ethnic',
  description: 'Manage your Suki Ethnic account, view orders, and update your addresses.',
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
