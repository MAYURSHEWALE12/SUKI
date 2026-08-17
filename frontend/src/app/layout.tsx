import type { Metadata } from "next";
import { Philosopher, Poppins, Playfair_Display } from "next/font/google";
import "./globals.css";
import "./account/account.css";
import "./admin/login/admin-login.css";
import "./checkout/checkout.css";
import "./collections/[category]/category.css";
import "./product/[id]/product.css";
import "./search/search.css";
import "./success/success.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import CartDrawer from "@/components/CartDrawer";
import GlobalReviews from "@/components/GlobalReviews";

const philosopher = Philosopher({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-display",
});

const playfair = Playfair_Display({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-playfair",
});

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Suki Ethnic | Wear the trend. Own the moment.",
  description: "Trendy, festive, affordable-premium ethnic fashion for young Indian women. Shop lehengas, sarees, and party wear.",
};

import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { ToastProvider } from "@/context/ToastContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${philosopher.variable} ${poppins.variable} ${playfair.variable}`}>
      <body>
        <CartProvider>
          <WishlistProvider>
            <ToastProvider>
              <Header />
              <CartDrawer />
              <main>{children}</main>
              <Footer />
              <FloatingWhatsApp />
              <GlobalReviews />
            </ToastProvider>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
