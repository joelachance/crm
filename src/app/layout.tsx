import type { Metadata } from "next";
import localFont from "next/font/local";

import "@/app/globals.css";

const basementGrotesque = localFont({
  src: "./fonts/BasementGrotesque-Black_v1.202.otf",
  variable: "--font-era",
  display: "swap"
});

export const metadata: Metadata = {
  title: "ERA",
  description: "monitoring the situation"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${basementGrotesque.variable} min-h-screen bg-[#050505] text-white antialiased`}>
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0,transparent_120px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_100%,28px_28px,28px_28px]" />
          <main className="mx-auto max-w-[1400px] px-4 py-5 lg:px-6 lg:py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
