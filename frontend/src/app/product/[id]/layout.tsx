import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Product Details | Suki Ethnic',
  description: 'View exclusive premium ethnic wear, lehengas, sarees, and suits at Suki Ethnic.',
};

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
