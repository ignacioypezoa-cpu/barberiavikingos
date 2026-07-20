"use client";
import { useEffect, useState } from "react";
import { EmailConfigPanel } from "@/components/EmailConfigPanel";
import { AdvancedConfigPanel } from "@/components/AdvancedConfigPanel";
import { SiteImagesManager } from "@/components/SiteImagesManager";
import { ImagePickerModal } from "@/components/ImagePickerModal";
import { ImageField } from "@/components/ImageField";

const fields = [
  ["businessName","Nombre de la barbería","text"],["primaryColor","Color principal","color"],["phone","Teléfono principal","text"],["whatsapp","WhatsApp","text"],
  ["email","Correo de contacto","email"],["instagram","Instagram","text"],["facebook","Facebook","text"],["address","Dirección principal","text"],
  ["heroTitle","Texto principal del Home","text"],["heroSubtitle","Texto secundario del Home","textarea"],["generalHours","Horario general","text"],["taxRate","IVA (%)","number"]
];
export function AdminConfig() {
  const [form,setForm]=useState<any>({}); const [saving,setSaving]=useState(false); const [message,setMessage]=useState("");
  const [pickerKey,setPickerKey]=useState<string | null>(null);
  useEffect(()=>{fetch("/api/admin/config").then(r=>r.json()).then(setForm)},[]);
  const update=(key:string,value:any)=>setForm((f:any)=>({...f,[key]:value}));
  async function save(e:React.FormEvent){e.preventDefault();setSaving(true);const r=await fetch("/api/admin/config",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});const d=await r.json();setSaving(false);setMessage(r.ok?"Configuración guardada. La web pública ya usa estos datos.":d.error)}
  return <><header className="admin-top"><div><h1>Configuración</h1><p>Identidad, contacto, contenido principal y correo electrónico.</p></div></header>{message&&<div className="admin-alert success">{message}<button onClick={()=>setMessage("")}>×</button></div>}
    <form className="panel config-form" onSubmit={save}><div className="field-grid">{fields.map(([key,label,type])=><div className={`field ${type==="textarea"?"field-full":""}`} key={key}><label>{label}</label>{type==="textarea"?<textarea rows={3} value={form[key]||""} onChange={e=>update(key,e.target.value)}/>:<input type={type} value={form[key]??""} onChange={e=>update(key,type==="number"?Number(e.target.value):e.target.value)}/>}</div>)}
      {([["logo","Logo"],["heroImage","Imagen principal del Home"]] as string[][]).map(([key,label])=><ImageField key={key} label={label} value={form[key]} onChange={(value)=>update(key,value)} onPick={()=>setPickerKey(key)} />)}
    </div><button className="button" disabled={saving}>{saving?"Guardando...":"Guardar configuración"}</button></form>
    {pickerKey&&<ImagePickerModal currentUrl={form[pickerKey]} title="Seleccionar imagen" onClose={()=>setPickerKey(null)} onSelect={(url)=>update(pickerKey,url)} />}
    <SiteImagesManager />
    <EmailConfigPanel /><AdvancedConfigPanel /></>;
}
