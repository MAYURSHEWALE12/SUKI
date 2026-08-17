import { Metadata } from 'next';

type Props = {
  params: Promise<{ category: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const displayCategory = category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  
  return {
    title: `${displayCategory} | Suki Ethnic`,
    description: `Shop our exclusive collection of premium ${category} at Suki Ethnic.`,
  };
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
