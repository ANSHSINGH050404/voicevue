import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Interview Agent",
  description: "Practice interviews with an adaptive AI interviewer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b">
          <div className="container mx-auto px-4 h-14 flex items-center">
            <Link href="/" className="font-semibold text-lg">
              AI Interview Agent
            </Link>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
