import type { Metadata } from "next";
import { Geist } from "next/font/google";
import PwaRegister from "@/components/pwa-register";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FilmFinder | Actuele films",
  description: "Ontdek actuele films, beoordelingen en trailers.",
  applicationName: "FilmFinder",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/filmfinder-icon-192.png",
    apple: "/filmfinder-icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FilmFinder",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl" className={geist.variable}>
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
