import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from '@/lib/context/AuthContext';
import { SocketProvider } from '@/lib/context/SocketContext';
import { ToastProvider } from '@/lib/context/ToastContext';
import './globals.css';

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
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <SocketProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}