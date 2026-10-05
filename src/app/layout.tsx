import type { Metadata } from "next";
import "./globals.css";
import { Inter } from 'next/font/google';
import { Nav } from "../components/nav";
import { Footer } from "../components/footer";

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <div style={{ minHeight: "100vh" }}>
          <main className="container">
            <Nav />
            {children}
            <hr className="rule" />
            <Footer />
          </main>
        </div>
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  title: {
    default: "Nicole Lee",
    template: "%s · Nicole Lee",
  },
  description: "Nicole Lee 2026 Portfolio",
};
