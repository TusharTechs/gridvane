import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GridVane | Physics-Verified, Quantum-Safe Thermo-Carbon VPP & Climate Ledger",
  description:
    "IEEE ClimateChain Global Hackathon 2026: Coupling IEEE 33-Bus AC Power Flow, IEEE Std C57.91 Transformer Thermal Aging, IEEE Std 738 Dynamic Line Rating, Kirchhoff FDIA Firewall, NIST FIPS 204 ML-DSA-65 Post-Quantum Signatures, and IEEE P3271.01 Recurring DLT Settlement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${jakarta.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-[#040812] font-sans text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        {children}
      </body>
    </html>
  );
}
