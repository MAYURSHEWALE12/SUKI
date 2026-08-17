import Link from "next/link";
import ProductCard from "@/components/ProductCard";

const mockProducts = [
  {
    _id: "1",
    name: "Midnight Noir Sequin Saree",
    originalPrice: 8999,
    price: 4499,
    category: "Sarees",
    isNewArrival: false,
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=600&auto=format&fit=crop",
  },
  {
    _id: "2",
    name: "Rose Gold Embellished Lehenga",
    originalPrice: 14999,
    price: 9999,
    category: "Lehengas",
    isNewArrival: true,
    image: "https://images.unsplash.com/photo-1583391733958-d15fa693d502?q=80&w=600&auto=format&fit=crop",
  },
  {
    _id: "3",
    name: "Emerald Green Silk Lehenga",
    originalPrice: 5499,
    price: 2999,
    category: "Lehengas",
    isNewArrival: false,
    image: "https://images.unsplash.com/photo-1617261075727-46323497d51b?q=80&w=600&auto=format&fit=crop",
  },
  {
    _id: "4",
    name: "Ivory & Gold Georgette Lehenga",
    originalPrice: 12499,
    price: 7499,
    category: "Lehengas",
    isNewArrival: false,
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600&auto=format&fit=crop",
  },
  {
    _id: "5",
    name: "Royal Blue Velvet Lehenga",
    originalPrice: 18999,
    price: 12499,
    category: "Lehengas",
    isNewArrival: false,
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600&auto=format&fit=crop",
  },
  {
    _id: "6",
    name: "Blush Pink Net Lehenga",
    originalPrice: 9999,
    price: 5999,
    category: "Lehengas",
    isNewArrival: false,
    image: "https://images.unsplash.com/photo-1583391733958-d15fa693d502?q=80&w=600&auto=format&fit=crop",
  }
];

export default function LehengasPage() {
  return (
    <div className="container plp-layout">
      {/* Sidebar Filters */}
      <aside className="plp-sidebar">
        <h3>Filters</h3>
        <div className="filter-group">
          <h4>Price</h4>
          <label><input type="checkbox" /> Under ₹2,999</label>
          <label><input type="checkbox" /> ₹3,000 - ₹5,999</label>
          <label><input type="checkbox" /> ₹6,000 - ₹9,999</label>
          <label><input type="checkbox" /> Above ₹10,000</label>
        </div>
        <div className="filter-group">
          <h4>Color</h4>
          <label><input type="checkbox" /> Pink</label>
          <label><input type="checkbox" /> Red</label>
          <label><input type="checkbox" /> Gold</label>
          <label><input type="checkbox" /> Black</label>
        </div>
        <div className="filter-group">
          <h4>Occasion</h4>
          <label><input type="checkbox" /> Wedding</label>
          <label><input type="checkbox" /> Festive</label>
          <label><input type="checkbox" /> Party Wear</label>
        </div>
      </aside>

      {/* Main Content */}
      <main className="plp-main">
        <div className="plp-header">
          <h2>Lehengas</h2>
          <div className="sort-by">
            <select>
              <option>Sort by: Best Selling</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Newest Arrivals</option>
            </select>
          </div>
        </div>

        <div className="product-grid">
          {mockProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </main>
    </div>
  );
}
