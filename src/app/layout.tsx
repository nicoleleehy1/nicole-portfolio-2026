import type { Metadata, Viewport } from "next";
import "./globals.css";
import { EB_Garamond, Fraunces, IBM_Plex_Mono } from "next/font/google";
import { Nav } from "../components/nav";
import { Footer } from "../components/footer";
import { LiveClock } from "../components/live-clock";
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
    <html lang="en" className={`${fraunces.variable} ${garamond.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head>
        {/* apply a saved light-mode choice before first paint, so the page never flashes dark */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        {/* The living background sits behind every page and persists across navigation. */}
        <CellFieldProvider>
          <div className="page">
            <main className="container">
              <Nav />
              <LiveClock />
              {children}
              <Footer />
            </main>
          </div>
        </CellFieldProvider>
      </body>
    </html>
  );
}

const THEME_SCRIPT = `try{if(localStorage.getItem("theme")==="light")document.documentElement.dataset.theme="light"}catch(e){}`;

export const metadata: Metadata = {
  title: {
    default: "Nicole Lee",
    template: "%s · Nicole Lee",
  },
  description: "Nicole Lee 2026 Portfolio",
};

export const viewport: Viewport = {
  themeColor: "#010305",
  colorScheme: "dark light",
};
