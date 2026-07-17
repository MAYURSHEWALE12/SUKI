import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Results | Suki Ethnic',
  description: 'Search for premium ethnic wear including sarees, lehengas, and suits at Suki Ethnic.',
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
