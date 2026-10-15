import { Saira_Condensed, VT323 } from "next/font/google";
import "./globals.css";

const saira = Saira_Condensed({ subsets: ["latin"], weight: ["500", "700", "800"], variable: "--font-saira" });
const vt = VT323({ subsets: ["latin"], weight: "400", variable: "--font-vt" });

export const metadata = {
  title: "Fart Finder",
  description: "Hazmat fart detector and heartbreak monitor for street bits.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
  appleWebApp: { capable: true, title: "Fart Finder", statusBarStyle: "black-translucent" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0d0e0b",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${saira.variable} ${vt.variable}`}>
      <body>{children}</body>
    </html>
  );
}
