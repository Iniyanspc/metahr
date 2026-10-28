import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "metadatum People", template: "%s · metadatum People" },
  description: "Internal HR portal for metadatum",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${inter.variable} ${poppins.variable} h-full antialiased`}>
      <body className="min-h-full bg-white text-black">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
