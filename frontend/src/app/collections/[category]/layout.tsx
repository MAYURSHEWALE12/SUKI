import { Metadata } from 'next';

type Props = {
  params: Promise<{ category: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const displayCategory = category.charAt(0).toUpperCase() + category.slice(1);
  
  return {
    title: `${displayCategory} | Suki Ethnic`,
    description: `Shop our exclusive collection of premium ${category} at Suki Ethnic.`,
  };
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
