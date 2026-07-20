import type { Metadata } from "next";
import "./globals.css";
import { getBusinessConfig } from "@/lib/public-data";
import { PwaRegister } from "@/components/PwaRegister";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getBusinessConfig().catch(() => null);
  const name = config?.businessName || "Barbería";
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
    title: { default: name, template: `%s | ${name}` },
    description: config?.heroSubtitle || "Barbería premium.",
    openGraph: { title: name, description: config?.heroSubtitle || "Barbería premium.", type: "website", images: ["/opengraph-image"] },
    robots: { index: true, follow: true }
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}<PwaRegister /></body>
    </html>
  );
}
