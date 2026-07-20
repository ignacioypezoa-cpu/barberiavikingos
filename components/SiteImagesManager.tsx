"use client";
import { useEffect, useState } from "react";
import { Copy, ImagePlus, RefreshCw, Trash2, Upload } from "lucide-react";

type SiteImage = {
  name: string;
  url: string;
  size: number | null;
  updatedAt: string | null;
  source: "upload" | "public" | "external" | "referenced";
  deletable: boolean;
  deleteName: string | null;
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

const sections = [
  { key: "home", title: "Home", description: "Imagen principal y recursos visuales de la portada.", matches: (image: SiteImage) => image.usage.businessHero > 0 },
  { key: "brand", title: "Marca y sistema", description: "Logo, iconos y piezas base del sitio.", matches: (image: SiteImage) => image.usage.businessLogo > 0 || image.url.startsWith("/images/") },
  { key: "branches", title: "Sucursales", description: "Imagenes asignadas a locales y puntos de atencion.", matches: (image: SiteImage) => image.usage.branches > 0 },
  { key: "barbers", title: "Barberos", description: "Fotos del equipo y perfiles profesionales.", matches: (image: SiteImage) => image.usage.barbers > 0 },
  { key: "services", title: "Servicios", description: "Imagenes del catalogo de servicios y reservas.", matches: (image: SiteImage) => image.usage.services > 0 },
  { key: "products", title: "Productos", description: "Imagenes usadas en la tienda.", matches: (image: SiteImage) => image.usage.products > 0 },
  { key: "unused", title: "Subidas sin uso", description: "Archivos disponibles que aun no estan asignados.", matches: (image: SiteImage) => image.usage.total === 0 && image.source === "upload" }
];

function sourceLabel(source: SiteImage["source"]) {
  if (source === "upload") return "Subida";
  if (source === "public") return "Sitio";
  if (source === "external") return "Externa";
  return "Referenciada";
}

function formatSize(size: number | null) {
  if (size === null) return "URL externa";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function usageLabel(image: SiteImage) {
  const parts = [
    image.usage.businessLogo ? "Logo" : "",
    image.usage.businessHero ? "Home" : "",
    image.usage.branches ? `${image.usage.branches} sucursal(es)` : "",
    image.usage.barbers ? `${image.usage.barbers} barbero(s)` : "",
    image.usage.services ? `${image.usage.services} servicio(s)` : "",
    image.usage.products ? `${image.usage.products} producto(s)` : ""
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "Sin uso";
}

function groupImages(images: SiteImage[]) {
  const used = new Set<string>();
  return sections.map((section) => {
    const items = images.filter((image) => !used.has(image.url) && section.matches(image));
    items.forEach((image) => used.add(image.url));
    return { ...section, items };
  }).filter((section) => section.items.length > 0);
}

export function SiteImagesManager() {
  const [images, setImages] = useState<SiteImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const response = await fetch("/api/admin/images");
    const data = await response.json();
    setLoading(false);
    if (response.ok) setImages(data);
    else setError(data.error || "No se pudieron cargar las imagenes.");
  }

  useEffect(() => { load(); }, []);

  async function upload(file: File) {
    setMessage("");
    setError("");
    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/admin/upload", { method: "POST", body });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "No se pudo subir la imagen.");
      return;
    }
    setMessage("Imagen subida correctamente.");
    await load();
  }

  async function replace(image: SiteImage, file: File) {
    setMessage("");
    setError("");
    const body = new FormData();
    body.append("file", file);
    const uploadResponse = await fetch("/api/admin/upload", { method: "POST", body });
    const uploadData = await uploadResponse.json();
    if (!uploadResponse.ok) {
      setError(uploadData.error || "No se pudo subir la imagen.");
      return;
    }

    const replaceResponse = await fetch("/api/admin/images", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldUrl: image.url, newUrl: uploadData.url })
    });
    const replaceData = await replaceResponse.json();
    if (!replaceResponse.ok) {
      setError(replaceData.error || "No se pudo reemplazar la imagen.");
      return;
    }
    setMessage(replaceData.updated > 0 ? "Imagen reemplazada en el sitio." : "Imagen subida correctamente.");
    await load();
  }

  async function copy(url: string) {
    await navigator.clipboard.writeText(url);
    setMessage("URL copiada al portapapeles.");
  }

  async function remove(image: SiteImage) {
    if (!image.deletable || !image.deleteName) {
      setError("Solo se pueden eliminar imagenes subidas desde el administrador.");
      return;
    }
    if (image.usage.total > 0) {
      setError("Esta imagen esta en uso. Quita su referencia antes de eliminarla.");
      return;
    }
    if (!confirm(`Eliminar ${image.name}?`)) return;
    const response = await fetch(`/api/admin/images/${encodeURIComponent(image.deleteName)}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "No se pudo eliminar la imagen.");
      return;
    }
    setMessage("Imagen eliminada.");
    await load();
  }

  const groups = groupImages(images);

  return <section className="panel image-manager">
    <div className="settings-section-head">
      <div className="settings-icon"><ImagePlus size={19} /></div>
      <div>
        <h2>Biblioteca de imagenes</h2>
        <p>Consulta, sube y administra los archivos disponibles. Asignalos desde cada formulario con Cambiar imagen.</p>
      </div>
    </div>

    {message && <div className="admin-alert success">{message}<button onClick={() => setMessage("")}>x</button></div>}
    {error && <div className="admin-alert error">{error}<button onClick={() => setError("")}>x</button></div>}

    <div className="image-manager-toolbar">
      <label className="button button-outline"><Upload size={15} /> Subir imagen<input hidden type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])} /></label>
      <button className="button button-outline" type="button" onClick={load}><RefreshCw size={15} /> Actualizar</button>
      <span>{loading ? "Cargando..." : `${images.length} imagen(es) en ${groups.length} seccion(es)`}</span>
    </div>

    <div className="image-section-list">
      {groups.map((section) => <div className="image-section" key={section.key}>
        <div className="image-section-head">
          <div>
            <h3>{section.title}</h3>
            <p>{section.description}</p>
          </div>
          <span>{section.items.length}</span>
        </div>
        <div className="image-grid">
          {section.items.map((image) => <article className="image-card" key={image.url}>
            <div className="image-preview"><img src={image.url} alt={image.name} /></div>
            <div className="image-card-body">
              <strong title={image.name}>{image.name}</strong>
              <span>{sourceLabel(image.source)} - {formatSize(image.size)}{image.updatedAt ? ` - ${new Date(image.updatedAt).toLocaleDateString("es-CL")}` : ""}</span>
              <small className={image.usage.total ? "in-use" : ""}>{usageLabel(image)}</small>
            </div>
            <div className="image-actions">
              <label aria-label="Cambiar imagen"><Upload size={14} /> Cambiar<input hidden type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && replace(image, event.target.files[0])} /></label>
              <button type="button" aria-label="Copiar URL" onClick={() => copy(image.url)}><Copy size={14} /></button>
              <button type="button" aria-label="Eliminar imagen" className="danger" disabled={!image.deletable || image.usage.total > 0} onClick={() => remove(image)}><Trash2 size={14} /></button>
            </div>
          </article>)}
        </div>
      </div>)}
    </div>
  </section>;
}
