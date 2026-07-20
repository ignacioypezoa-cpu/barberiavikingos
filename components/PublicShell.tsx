import { Header } from "./Header";
import { Footer } from "./Footer";
import { WhatsApp } from "./WhatsApp";
import { getBusinessConfig } from "@/lib/public-data";

export async function PublicShell({ children }: { children: React.ReactNode }) {
  const config = await getBusinessConfig();
  if (!config) throw new Error("Falta ejecutar el seed de configuración.");
  return (
    <>
      <style>{`:root{--gold:${config.primaryColor};}`}</style>
      <Header businessName={config.businessName} logo={config.logo} />
      <main>{children}</main>
      <Footer config={config} />
      <WhatsApp number={config.whatsapp} />
    </>
  );
}
