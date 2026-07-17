import Link from "next/link";
import HeroCarousel from "@/components/HeroCarousel";
import ProductCarousel from "@/components/ProductCarousel";
import BestSellersGrid from "@/components/BestSellersGrid";
import ReelsCarousel from "@/components/ReelsCarousel";

export default function Home() {
  return (
    <div className="homepage">
      <HeroCarousel />
      
      <ProductCarousel title="Trending Arrivals" />

      {/* Story Strip */}
      <section className="story-strip container">
        {[
          { id: 1, img: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=200&auto=format&fit=crop", title: "New Arrivals" },
          { id: 2, img: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=200&auto=format&fit=crop", title: "Sarees" },
          { id: 3, img: "/hero_banner_suki.png", title: "Suits" },
          { id: 4, img: "/hero_banner_suki.png", title: "Lehengas" },
          { id: 5, img: "/hero_banner_suki.png", title: "Bestsellers" },
        ].map((story) => (
          <div key={story.id} className="story-item">
            <div className="story-circle" style={{ backgroundImage: `url(${story.img})` }}></div>
            <span>{story.title}</span>
          </div>
        ))}
      </section>

      {/* Category Tiles */}
      <section className="categories container">
        <div className="category-tile lehengas" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <h3>Lehengas</h3>
          <Link href="/collections/lehengas" className="btn btn-primary">Explore</Link>
        </div>
        <div className="category-tile sarees" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <h3>Sarees</h3>
          <Link href="/collections/sarees" className="btn btn-primary">Explore</Link>
        </div>
      </section>

      <ReelsCarousel />

      <BestSellersGrid />

      {/* Trust Strip */}
      <section className="trust-strip">
        <div className="container trust-grid">
          <div className="trust-item">
            <div className="trust-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C12 7.5 16.5 12 22 12C16.5 12 12 16.5 12 22C12 16.5 7.5 12 2 12C7.5 12 12 7.5 12 2Z"></path></svg></div>
            <div className="trust-text">
              <h4>Free Shipping</h4>
              <p>On orders over ₹1499</p>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C12 7.5 16.5 12 22 12C16.5 12 12 16.5 12 22C12 16.5 7.5 12 2 12C7.5 12 12 7.5 12 2Z"></path></svg></div>
            <div className="trust-text">
              <h4>COD Available</h4>
              <p>Pay on delivery</p>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C12 7.5 16.5 12 22 12C16.5 12 12 16.5 12 22C12 16.5 7.5 12 2 12C7.5 12 12 7.5 12 2Z"></path></svg></div>
            <div className="trust-text">
              <h4>Easy Returns</h4>
              <p>7-day return policy</p>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C12 7.5 16.5 12 22 12C16.5 12 12 16.5 12 22C12 16.5 7.5 12 2 12C7.5 12 12 7.5 12 2Z"></path></svg></div>
            <div className="trust-text">
              <h4>Secure Payments</h4>
              <p>100% safe & secure</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
