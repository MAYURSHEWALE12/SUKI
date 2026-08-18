import Link from 'next/link';
import Image from 'next/image';
import './occasions.css';

export const metadata = {
  title: 'Shop by Occasion | Suki Ethnic',
  description: 'Find the perfect outfit for every moment — Diwali, weddings, parties and everyday wear. Shop occasion-ready ethnic fashion at Suki Ethnic.',
};

const OCCASIONS = [
  {
    slug: 'diwali',
    title: 'Diwali Edit',
    subtitle: 'Light up the festival',
    description: 'Shimmering silks and festive zari work for the most radiant season of the year.',
    image: '/images/sarees_banner.png',
  },
  {
    slug: 'wedding',
    title: 'Wedding Edit',
    subtitle: 'Bridal & guest ready',
    description: 'From bridal trousseaus to guest looks — make every wedding moment unforgettable.',
    image: '/images/banner.png',
  },
  {
    slug: 'party',
    title: 'Party Edit',
    subtitle: 'Own the celebration',
    description: 'Statement lehengas and glamorous dresses for nights worth remembering.',
    image: '/images/banner.png',
  },
  {
    slug: 'daily-wear',
    title: 'Daily Wear Edit',
    subtitle: 'Effortless elegance',
    description: 'Comfortable, chic and easy — beautiful ethnic wear for your everyday moments.',
    image: '/images/sarees_banner.png',
  },
];

export default function OccasionsPage() {
  return (
    <div className="occasions-page container">
      <div className="occasions-header">
        <h1 className="occasions-title">Shop by Occasion</h1>
        <p className="occasions-subtitle">Every moment deserves an outfit. Find yours.</p>
      </div>

      <div className="occasions-grid">
        {OCCASIONS.map((occasion) => (
          <Link key={occasion.slug} href={`/occasions/${occasion.slug}`} className="occasion-card">
            <div className="occasion-card-image">
              <Image
                src={occasion.image}
                alt={occasion.title}
                width={1774}
                height={887}
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div className="occasion-card-overlay">
              <span className="occasion-card-subtitle">{occasion.subtitle}</span>
              <h2 className="occasion-card-title">{occasion.title}</h2>
              <p className="occasion-card-desc">{occasion.description}</p>
              <span className="occasion-card-link">Shop Now →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}