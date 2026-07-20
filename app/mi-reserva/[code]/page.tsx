import type { Metadata } from "next";
import { PublicShell } from "@/components/PublicShell";
import { ManageAppointment } from "@/components/ManageAppointment";
export const metadata:Metadata={title:"Gestionar reserva",robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{code:string}>}){const{code}=await params;return <PublicShell><section className="page-hero"><span className="eyebrow">Autogestión</span><h1>Tu reserva.</h1><p>Reagenda, cancela o agrega tu cita al calendario.</p></section><section className="page-content"><ManageAppointment code={code}/></section></PublicShell>}
