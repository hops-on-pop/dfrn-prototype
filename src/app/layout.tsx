import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Schoolbell } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const schoolbell = Schoolbell({
  weight: "400",
  variable: "--font-schoolbell",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Digital Family Resource Navigator",
  description: "Find information about programs, services, and resources.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${schoolbell.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
