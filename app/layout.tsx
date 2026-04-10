import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EventBookings — Find & Book Live Experiences",
  description:
    "Discover concerts, conferences, art fairs, food festivals, and more. Book tickets in seconds with instant confirmation.",
  keywords: ["events", "tickets", "concerts", "conferences", "booking"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased font-[var(--font-inter)]">
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#0d1f2d",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                fontSize: "14px",
                padding: "12px 16px",
              },
              success: {
                iconTheme: { primary: "#00d26a", secondary: "#0d1f2d" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#0d1f2d" },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
