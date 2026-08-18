import Link from "next/link";
import Image from "next/image";
import HeroCarousel from "@/components/HeroCarousel";
import BestSellersGrid from "@/components/BestSellersGrid";
import LehengasGrid from "@/components/LehengasGrid";
import SareesGrid from "@/components/SareesGrid";
import ReelsCarousel from "@/components/ReelsCarousel";
import RecentlyViewed from "@/components/RecentlyViewed";
import YouMayAlsoLike from "@/components/YouMayAlsoLike";

export default function Home() {
  return (
    <div className="homepage">
      <HeroCarousel />

      <RecentlyViewed />
      <YouMayAlsoLike />



      <ReelsCarousel />

      {/* New Banner and Lehengas Section */}
      <section className="banner-section" style={{ width: '100%' }}>
        <Image 
          src="/images/banner.png" 
          alt="Suki Ethnic Banner" 
          width={1717}
          height={677}
          sizes="100vw"
          style={{ width: '100%', display: 'block', height: 'auto', maxHeight: '550px', objectFit: 'cover' }} 
        />
      </section>
      <LehengasGrid />

      {/* Saree Banner and Grid */}
      <section className="banner-section" style={{ width: '100%' }}>
        <Image 
          src="/images/sarees_banner.png" 
          alt="Suki Ethnic Sarees Banner" 
          width={1774}
          height={887}
          sizes="100vw"
          style={{ width: '100%', display: 'block', height: 'auto', maxHeight: '550px', objectFit: 'cover' }} 
        />
      </section>
      <SareesGrid />

      <BestSellersGrid />

      {/* Story Strip */}
      <section className="story-strip container">
        {[
          { id: 1, img: "/images/lehenga.png", url: "/collections/lehengas" },
          { id: 2, img: "/images/sarees.png", url: "/collections/sarees" },
          { id: 3, img: "/images/party wear saree.png", url: "/collections/half-sarees" },
          { id: 4, img: "/images/navratri ghagra.png", url: "/collections/navratri-ghagra" },
        ].map((story) => (
          <Link key={story.id} href={story.url} className="story-item" style={{ textDecoration: 'none' }}>
            <div className="story-circle" style={{ backgroundImage: `url('${story.img}')`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '12px' }}></div>
          </Link>
        ))}
      </section>

    </div>
  );
}
