import type { Metadata } from "next";
import { Inter, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-noto-bengali",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

import { PersonJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: {
    template: "%s | Prof. Surajit Borkotokey",
    default: "Prof. Surajit Borkotokey | Mathematics, Game Theory & Bilingual Archive",
  },
  description:
    "Official academic portfolio, mathematical research in Cooperative Game Theory and Network Science, and bilingual essays in English and Assamese (অসমীয়া) by Prof. Surajit Borkotokey, Professor of Mathematics, Dibrugarh University.",
  keywords: [
    "Prof. Surajit Borkotokey",
    "Surajit Borkotokey",
    "Dibrugarh University",
    "Professor of Mathematics Dibrugarh",
    "Cooperative Game Theory",
    "Network Science",
    "Assamese Blog",
    "অসমীয়া ব্লগ",
    "অসমীয়া প্ৰবন্ধ",
    "Surajit Borkotokey Blog",
    "Dean Student Affairs Dibrugarh University",
    "Director Office of International Affairs",
    "Corvinus University CIAS Fellow",
    "Indo-US Fellow",
    "Operations Research",
    "Multilinear Algebra",
    "Academic Portfolio",
    "Bilingual Writings",
  ],
  authors: [{ name: "Prof. Surajit Borkotokey" }],
  creator: "Prof. Surajit Borkotokey",
  publisher: "Prof. Surajit Borkotokey",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": "/rss.xml",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    siteName: "Prof. Surajit Borkotokey",
    title: "Prof. Surajit Borkotokey | Mathematics, Game Theory & Bilingual Archive",
    description:
      "Academic portfolio, mathematical research in Cooperative Game Theory, and bilingual essays by Prof. Surajit Borkotokey, Professor of Mathematics, Dibrugarh University.",
    type: "profile",
    locale: "en_US",
    images: [
      {
        url: "/images/surajit-borkotokey-hero.jpg",
        width: 800,
        height: 800,
        alt: "Prof. Surajit Borkotokey - Professor of Mathematics, Dibrugarh University",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prof. Surajit Borkotokey | Mathematics, Game Theory & Bilingual Archive",
    description:
      "Academic portfolio, mathematical research in Cooperative Game Theory, and bilingual essays by Prof. Surajit Borkotokey.",
    images: ["/images/surajit-borkotokey-hero.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${notoSansBengali.variable} h-full`}
    >
      <head>
        <PersonJsonLd />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TooltipProvider delay={200}>
            {children}
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
