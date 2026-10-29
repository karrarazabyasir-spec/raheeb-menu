import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "مطعم رهيب | المينيو الإلكتروني",
  description: "اطلب وجبتك المفضلة من مطعم رهيب مباشرة عبر مسح الرمز. تجربة طعام فريدة وسريعة.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "مطعم رهيب",
  },
  other: {
    "color-scheme": "light only light",
    "supported-color-schemes": "light",
    "darkreader-lock": "true",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} h-full antialiased font-sans bg-white`}
      style={{ colorScheme: "light", backgroundColor: "#ffffff" }}
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="color-scheme" content="light only light" />
        <meta name="supported-color-schemes" content="light" />
        <meta name="darkreader-lock" content="true" />
      </head>
      <body
        className="min-h-full bg-white text-[#222222] selection:bg-[#780000] selection:text-white flex flex-col font-sans"
        style={{ backgroundColor: "#ffffff" }}
      >
        {children}
      </body>
    </html>
  );
}
