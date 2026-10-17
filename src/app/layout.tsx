import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GridVane | Physics-Verified, Quantum-Safe Thermo-Carbon VPP & Climate Ledger",
  description:
    "IEEE ClimateChain Global Hackathon 2026: Coupling IEEE 33-Bus AC Power Flow, IEEE Std C57.91 Transformer Thermal Aging, Kirchhoff FDIA Firewall, NIST FIPS 204 ML-DSA-65 Post-Quantum Signatures, and IEEE P3271.01 Recurring DLT Settlement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-grid-bg text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        {children}
      </body>
    </html>
  );
}
