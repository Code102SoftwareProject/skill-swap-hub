import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from '@/lib/context/AuthContext';
import { ToastProvider } from '@/lib/context/ToastContext';
//import ProtectRoute from '@/lib/middleware/ProtectRoute';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkillSwap Hub",
  description: "Connect, Learn, and Share Your Skills",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`
      }
      suppressHydrationWarning={true}
      >
        <AuthProvider>
          <ToastProvider>
            
              {children}
           
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}