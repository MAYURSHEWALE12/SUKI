import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shopping Cart | Suki Ethnic',
  description: 'Review the items in your shopping cart before proceeding to checkout at Suki Ethnic.',
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
