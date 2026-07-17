import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Order Successful | Suki Ethnic',
  description: 'Thank you for your purchase from Suki Ethnic.',
};

export default function SuccessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
