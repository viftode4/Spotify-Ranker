import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { MobileNavigation } from "@/components/MobileNavigation";
import { getSession } from "@/lib/auth";
import { SessionProvider } from "@/components/SessionProvider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Spotify Ranker",
  description: "Rank Spotify albums and create tier lists",
  viewport: {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover"
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en" className="dark h-full">
      <body className={`${inter.className} flex flex-col h-full bg-gradient-to-b from-background to-background/95`}>
        <SessionProvider session={session}>
          <Navbar session={session} />
          <main className="container py-8 px-4 mx-auto flex-1 md:pb-8 mb-[64px] md:mb-0">{children}</main>
          <MobileNavigation session={session} />
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
