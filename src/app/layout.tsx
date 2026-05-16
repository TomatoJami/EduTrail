import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionTimeout } from "@/components/SessionTimeout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EduTrail - Master Your Skills",
  description:
    "Learn the courses you need without any hassle. Track your progress, build your skills, and achieve your learning goals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Browser extensions can inject body attributes before hydration. */}
      <body className="min-h-screen flex flex-col bg-white" suppressHydrationWarning>
        <SessionTimeout />
        {children}
      </body>
    </html>
  );
}
