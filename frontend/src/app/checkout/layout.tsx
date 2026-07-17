import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout | Suki Ethnic',
  description: 'Complete your purchase securely at Suki Ethnic.',
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
