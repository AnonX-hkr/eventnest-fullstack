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
  title: "EventNest | Smart Ticketing",
  description:
    "EventNest — the smart way to discover, create, and sell tickets to live experiences. Concerts, conferences, art fairs, and more. Book in seconds with instant confirmation.",
  keywords: ["events", "tickets", "concerts", "conferences", "booking", "eventnest", "smart ticketing"],
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
                background: "#1a2b4b",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                fontSize: "14px",
                padding: "12px 16px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              },
              success: {
                iconTheme: { primary: "#00d26a", secondary: "#1a2b4b" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#1a2b4b" },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
