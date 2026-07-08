import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PageTransition } from "@/components/page-transition";

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Dr. Siri – Women Supporting Women",
    template: "%s | Dr. Siri",
  },
  description: "A premium e-commerce catalogue empowering women entrepreneurs. Browse sarees, chocolates, pickles, jewellery, and Maggam work, and contact sellers directly on WhatsApp.",
  openGraph: {
    title: "Dr. Siri – Women Supporting Women",
    description: "A premium e-commerce catalogue empowering women entrepreneurs.",
    type: "website",
    locale: "en_IN",
    url: "https://drsiri.com",
    siteName: "Dr. Siri",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dr. Siri – Women Supporting Women",
    description: "A premium e-commerce catalogue empowering women entrepreneurs.",
  },
  metadataBase: new URL("https://drsiri.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <Providers>
          <Header />
          <main className="flex-1 flex flex-col">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
