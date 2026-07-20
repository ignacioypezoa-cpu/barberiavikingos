"use client";
import { useEffect, useMemo, useState } from "react";
import { Check, Search, Upload, X } from "lucide-react";

type SiteImage = {
  name: string;
  url: string;
  size: number | null;
  updatedAt: string | null;
  source: "upload" | "public" | "external" | "referenced";
  usage: {
    total: number;
    businessLogo: number;
    businessHero: number;
    branches: number;
    barbers: number;
    services: number;
    products: number;
  };
};

type Props = {
  currentUrl?: string | null;
  title?: string;
  onClose: () => void;
  onSelect: (url: string) => void;
};

const sectionLabels = [
  { key: "all", label: "Todas", matches: () => true },
  { key: "home", label: "Home", matches: (image: SiteImage) => image.usage.businessHero > 0 },
  { key: "brand", label: "Marca", matches: (image: SiteImage) => image.usage.businessLogo > 0 || image.url.startsWith("/images/") },
  { key: "branches", label: "Sucursales", matches: (image: SiteImage) => image.usage.branches > 0 },
  { key: "barbers", label: "Barberos", matches: (image: SiteImage) => image.usage.barbers > 0 },
  { key: "services", label: "Servicios", matches: (image: SiteImage) => image.usage.services > 0 },
  { key: "products", label: "Productos", matches: (image: SiteImage) => image.usage.products > 0 },
  { key: "unused", label: "Sin uso", matches: (image: SiteImage) => image.usage.total === 0 && image.source === "upload" }
];

function sourceLabel(source: SiteImage["source"]) {
  if (source === "upload") return "Subida";
  if (source === "public") return "Sitio";
  if (source === "external") return "Externa";
  return "Referenciada";
}

export function ImagePickerModal({ currentUrl, title = "Seleccionar imagen", onClose, onSelect }: Props) {
  const [images, setImages] = useState<SiteImage[]>([]);
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("all");
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/admin/images");
    const data = await response.json();
    if (response.ok) setImages(data);
  }

  useEffect(() => { load(); }, []);

  async function upload(file: File) {
    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/admin/upload", { method: "POST", body });
    const data = await response.json();
    if (response.ok) {
      onSelect(data.url);
      onClose();
    } else {
      setMessage(data.error || "No se pudo subir la imagen.");
    }
  }

  const filtered = useMemo(() => {
    const active = sectionLabels.find((item) => item.key === section) || sectionLabels[0];
    return images.filter((image) => active.matches(image) && `${image.name} ${image.url}`.toLowerCase().includes(query.toLowerCase()));
  }, [images, query, section]);

  return <div className="modal-backdrop">
    <div className="admin-modal media-picker-modal">
      <div className="modal-head">
        <div>
          <h2>{title}</h2>
          <p>Sube una imagen nueva o elige una que ya exista.</p>
        </div>
        <button onClick={onClose}><X /></button>
      </div>

      {message && <div className="admin-alert success">{message}<button onClick={() => setMessage("")}>x</button></div>}

      <div className="media-picker-tools">
        <div className="admin-search"><Search size={16} /><input placeholder="Buscar por nombre o URL..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <label className="button button-outline"><Upload size={15} /> Subir<input hidden type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])} /></label>
      </div>

      <div className="media-picker-tabs">
        {sectionLabels.map((item) => <button type="button" className={section === item.key ? "active" : ""} key={item.key} onClick={() => setSection(item.key)}>{item.label}</button>)}
      </div>

      <div className="media-picker-grid">
        {filtered.map((image) => <button type="button" className={`media-picker-item ${currentUrl === image.url ? "selected" : ""}`} key={image.url} onClick={() => { onSelect(image.url); onClose(); }}>
          <img src={image.url} alt={image.name} />
          <span>{sourceLabel(image.source)}</span>
          <strong title={image.name}>{image.name}</strong>
          {currentUrl === image.url && <em><Check size={14} /> Actual</em>}
        </button>)}
      </div>
    </div>
  </div>;
}
