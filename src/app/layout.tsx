import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { ToastProvider } from "@/components/toast";
import { ErrorBoundary } from "@/components/error-boundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Merchant — Inventory & Sales",
  description: "Quiet inventory and sales management.",
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
      <body className="min-h-full bg-paper text-ink">
        <ToastProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex flex-1 flex-col min-w-0">
              <TopBar />
              <main className="flex-1 min-w-0 animate-fade-in">
                <ErrorBoundary>{children}</ErrorBoundary>
              </main>
            </div>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
