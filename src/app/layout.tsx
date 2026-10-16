import type { Metadata, Viewport } from "next";
import "./globals.css";
import { EB_Garamond, Fraunces, IBM_Plex_Mono } from "next/font/google";
import { Nav } from "../components/nav";
import { Footer } from "../components/footer";
import { CellFieldProvider } from "../components/cell-field";

const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  variable: "--font-fraunces",
});

// The home page copy
const garamond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-garamond",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${garamond.variable} ${plexMono.variable}`}>
      <body>
        {/* The living background sits behind every page and persists across navigation. */}
        <CellFieldProvider>
          <div className="page">
            <main className="container">
              <Nav />
              {children}
              <Footer />
            </main>
          </div>
        </CellFieldProvider>
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

export const viewport: Viewport = {
  themeColor: "#010305",
  colorScheme: "dark",
};
