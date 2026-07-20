"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit3, Plus, Power, Search, Trash2, X } from "lucide-react";
import { ImagePickerModal } from "@/components/ImagePickerModal";
import { ImageField } from "@/components/ImageField";

type Row = Record<string, any>;
type Field = { key: string; label: string; type?: string; required?: boolean; options?: { value: string; label: string }[] };
type CrudConfig = { title: string; subtitle: string; endpoint: string; fields: Field[]; columns: { key: string; label: string; render?: (row: Row) => string }[] };

const baseConfigs: Record<string, CrudConfig> = {
  sucursales: {
    title: "Sucursales", subtitle: "Las sucursales activas aparecen inmediatamente en la web.", endpoint: "/api/admin/branches",
    fields: [
      { key: "name", label: "Nombre", required: true }, { key: "address", label: "Dirección", required: true },
      { key: "commune", label: "Comuna", required: true }, { key: "city", label: "Ciudad", required: true },
      { key: "phone", label: "Teléfono", required: true }, { key: "whatsapp", label: "WhatsApp", required: true },
      { key: "openingTime", label: "Hora apertura", type: "time", required: true }, { key: "closingTime", label: "Hora cierre", type: "time", required: true },
      { key: "mapUrl", label: "Link Google Maps" }, { key: "image", label: "Imagen", type: "image" }
    ],
    columns: [{ key: "name", label: "Sucursal" }, { key: "commune", label: "Comuna" }, { key: "address", label: "Dirección" }, { key: "active", label: "Estado", render: (r) => r.active ? "Activa" : "Inactiva" }]
  },
  servicios: {
    title: "Servicios", subtitle: "Precios, duración e imágenes del catálogo y las reservas.", endpoint: "/api/admin/services",
    fields: [
      { key: "name", label: "Nombre", required: true }, { key: "category", label: "Categoría", required: true },
      { key: "description", label: "Descripción", type: "textarea", required: true }, { key: "duration", label: "Duración (min)", type: "number", required: true },
      { key: "price", label: "Precio", type: "number", required: true }, { key: "image", label: "Imagen", type: "image" }
    ],
    columns: [{ key: "name", label: "Servicio" }, { key: "category", label: "Categoría" }, { key: "duration", label: "Duración", render: (r) => `${r.duration} min` }, { key: "price", label: "Precio", render: (r) => `$${Number(r.price).toLocaleString("es-CL")}` }, { key: "active", label: "Estado", render: (r) => r.active ? "Activo" : "Inactivo" }]
  },
  productos: {
    title: "Productos", subtitle: "Catálogo, inventario y disponibilidad de la tienda.", endpoint: "/api/admin/products",
    fields: [
      { key: "name", label: "Nombre", required: true }, { key: "sku", label: "SKU", required: true },
      { key: "category", label: "Categoría", required: true }, { key: "brand", label: "Marca", required: true },
      { key: "description", label: "Descripción", type: "textarea", required: true }, { key: "price", label: "Precio", type: "number", required: true },
      { key: "stock", label: "Stock", type: "number", required: true }, { key: "image", label: "Imagen", type: "image" }
    ],
    columns: [{ key: "name", label: "Producto" }, { key: "sku", label: "SKU" }, { key: "category", label: "Categoría" }, { key: "stock", label: "Stock" }, { key: "price", label: "Precio", render: (r) => `$${Number(r.price).toLocaleString("es-CL")}` }, { key: "active", label: "Estado", render: (r) => r.active ? "Activo" : "Inactivo" }]
  },
  usuarios: {
    title: "Usuarios", subtitle: "Accesos y roles del equipo administrativo.", endpoint: "/api/admin/users",
    fields: [
      { key: "name", label: "Nombre", required: true }, { key: "email", label: "Correo", type: "email", required: true },
      { key: "password", label: "Contraseña", type: "password" }, { key: "role", label: "Rol", type: "select", required: true, options: [{ value: "ADMIN", label: "Admin general" }, { value: "BRANCH_MANAGER", label: "Encargado" }, { value: "BARBER", label: "Barbero" }] }
    ],
    columns: [{ key: "name", label: "Nombre" }, { key: "email", label: "Correo" }, { key: "role", label: "Rol" }, { key: "active", label: "Estado", render: (r) => r.active ? "Activo" : "Inactivo" }]
  },
  fidelizacion: {
    title: "Fidelización", subtitle: "Beneficios configurables por visitas y puntos.", endpoint: "/api/admin/loyalty",
    fields: [
      { key: "name", label: "Nombre", required: true }, { key: "visits", label: "Visitas requeridas", type: "number", required: true },
      { key: "points", label: "Puntos requeridos", type: "number", required: true },
      { key: "rewardType", label: "Tipo de premio", type: "select", required: true, options: [{value:"DISCOUNT",label:"Descuento"},{value:"FREE_SERVICE",label:"Servicio gratis"},{value:"PREMIUM_SERVICE",label:"Servicio premium"}] },
      { key: "rewardValue", label: "Valor / porcentaje", type: "number", required: true }, { key: "description", label: "Descripción", type: "textarea", required: true }
    ],
    columns: [{key:"name",label:"Beneficio"},{key:"visits",label:"Visitas"},{key:"points",label:"Puntos"},{key:"description",label:"Premio"},{key:"active",label:"Estado",render:r=>r.active?"Activo":"Inactivo"}]
  }
};

export function AdminCrud({ section }: { section: string }) {
  const [config, setConfig] = useState<CrudConfig | null>(baseConfigs[section] || null);
  const [rows, setRows] = useState<Row[]>([]); const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Row | null>(null); const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null); const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!config) return; setLoading(true);
    const response = await fetch(config.endpoint); const data = await response.json();
    if (response.ok) setRows(data); else setMessage({ type: "error", text: data.error });
    setLoading(false);
  }, [config]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (section !== "barberos") return;
    Promise.all([fetch("/api/admin/branches").then((r) => r.json()), fetch("/api/admin/services").then((r) => r.json())]).then(([branches, services]) => {
      setConfig({
        title: "Barberos", subtitle: "Equipo, servicios y jornadas visibles en la web y reservas.", endpoint: "/api/admin/barbers",
        fields: [
          { key: "firstName", label: "Nombre", required: true }, { key: "lastName", label: "Apellido", required: true },
          { key: "specialty", label: "Especialidad", required: true }, { key: "bio", label: "Descripción", type: "textarea", required: true },
          { key: "phone", label: "Teléfono" }, { key: "email", label: "Correo", type: "email" },
          { key: "branchId", label: "Sucursal", type: "select", required: true, options: branches.map((b: Row) => ({ value: b.id, label: `${b.name}${b.active ? "" : " (inactiva)"}` })) },
          { key: "serviceIds", label: "Servicios", type: "multiselect", options: services.map((s: Row) => ({ value: s.id, label: s.name })) },
          { key: "startTime", label: "Inicio jornada", type: "time" }, { key: "endTime", label: "Fin jornada", type: "time" },
          { key: "photo", label: "Foto", type: "image" }
        ],
        columns: [{ key: "firstName", label: "Nombre", render: (r) => `${r.firstName} ${r.lastName}` }, { key: "specialty", label: "Especialidad" }, { key: "branch", label: "Sucursal", render: (r) => r.branch?.name }, { key: "serviceNames", label: "Servicios" }, { key: "active", label: "Estado", render: (r) => r.active ? "Activo" : "Inactivo" }]
      });
    });
  }, [section]);

  const filtered = useMemo(() => rows.filter((row) => JSON.stringify(row).toLowerCase().includes(search.toLowerCase())), [rows, search]);
  if (!config) return null;
  const activeConfig = config;

  async function remove(row: Row) {
    if (!confirm(`¿Eliminar "${row.name || `${row.firstName} ${row.lastName}`}"? Si tiene historial quedará inactivo.`)) return;
    const response = await fetch(`${activeConfig.endpoint}/${row.id}`, { method: "DELETE" }); const data = await response.json();
    setMessage({ type: response.ok ? "success" : "error", text: response.ok ? "Registro eliminado correctamente." : data.error }); if (response.ok) load();
  }
  async function toggle(row: Row) {
    const response = await fetch(`${activeConfig.endpoint}/${row.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !row.active }) });
    if (response.ok) { setMessage({ type: "success", text: `Registro ${row.active ? "desactivado" : "activado"}.` }); load(); }
  }

  return (
    <>
      <header className="admin-top"><div><h1>{config.title}</h1><p>{config.subtitle}</p></div><button className="button button-small" onClick={() => { setEditing(null); setOpen(true); }}><Plus size={16} /> Nuevo</button></header>
      {message && <div className={`admin-alert ${message.type}`}>{message.text}<button onClick={() => setMessage(null)}>×</button></div>}
      <div className="panel">
        <div className="admin-toolbar"><div className="admin-search"><Search size={16} /><input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} /></div><span>{filtered.length} registros</span></div>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr>{config.columns.map((c) => <th key={c.key}>{c.label}</th>)}<th>Acciones</th></tr></thead>
          <tbody>{loading ? <tr><td colSpan={config.columns.length + 1}>Cargando...</td></tr> : filtered.map((row) => <tr key={row.id}>
            {config.columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : String(row[column.key] ?? "—")}</td>)}
            <td><div className="row-actions"><button title="Editar" onClick={() => { setEditing(row); setOpen(true); }}><Edit3 size={15} /></button><button title="Activar/Desactivar" onClick={() => toggle(row)}><Power size={15} /></button><button className="danger" title="Eliminar" onClick={() => remove(row)}><Trash2 size={15} /></button></div></td>
          </tr>)}</tbody></table></div>
      </div>
      {open && <CrudModal config={config} row={editing} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); setMessage({ type: "success", text: "Cambios guardados correctamente." }); load(); }} />}
    </>
  );
}

function CrudModal({ config, row, onClose, onSaved }: { config: CrudConfig; row: Row | null; onClose: () => void; onSaved: () => void }) {
  const initial = Object.fromEntries(config.fields.map((field) => [field.key, row?.[field.key] ?? (field.type === "multiselect" ? [] : "")]));
  const [form, setForm] = useState<Row>({ ...initial, active: row?.active ?? true }); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const [pickerField, setPickerField] = useState<string | null>(null);
  const update = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  async function save(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    const payload = { ...form }; if (row && payload.password === "") delete payload.password;
    const response = await fetch(row ? `${config.endpoint}/${row.id}` : config.endpoint, { method: row ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json(); setSaving(false); if (!response.ok) setError(data.error || "No se pudo guardar."); else onSaved();
  }
  function renderField(field: Field) {
    if (field.type === "image") return <ImageField key={field.key} label={field.label} value={form[field.key]} onChange={(value) => update(field.key, value)} onPick={() => setPickerField(field.key)} />;
    return <div className={`field ${field.type === "textarea" || field.type === "multiselect" ? "field-full" : ""}`} key={field.key}><label>{field.label}</label>
      {field.type === "textarea" ? <textarea rows={3} value={form[field.key]} onChange={(e) => update(field.key, e.target.value)} required={field.required} /> :
       field.type === "select" ? <select value={form[field.key]} onChange={(e) => update(field.key, e.target.value)} required={field.required}><option value="">Selecciona...</option>{field.options?.map((o) => <option value={o.value} key={o.value}>{o.label}</option>)}</select> :
       field.type === "multiselect" ? <div className="check-grid">{field.options?.map((o) => <label key={o.value}><input type="checkbox" checked={(form[field.key] || []).includes(o.value)} onChange={(e) => update(field.key, e.target.checked ? [...(form[field.key] || []), o.value] : (form[field.key] || []).filter((id: string) => id !== o.value))} /> {o.label}</label>)}</div> :
       <input type={field.type || "text"} value={form[field.key]} onChange={(e) => update(field.key, field.type === "number" ? Number(e.target.value) : e.target.value)} required={field.required && !(field.key === "password" && row)} />}
    </div>;
  }
  return <div className="modal-backdrop"><div className="admin-modal"><div className="modal-head"><div><h2>{row ? "Editar" : "Nuevo"} registro</h2><p>Los cambios se reflejarán en la web pública.</p></div><button onClick={onClose}><X /></button></div>
    <form onSubmit={save}><div className="field-grid">{config.fields.map(renderField)}</div>{error && <p className="error">{error}</p>}<div className="modal-actions"><button type="button" className="button button-outline" onClick={onClose}>Cancelar</button><button className="button" disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</button></div></form>
    {pickerField && <ImagePickerModal currentUrl={form[pickerField]} title="Seleccionar imagen" onClose={() => setPickerField(null)} onSelect={(url) => update(pickerField, url)} />}
  </div></div>;
}
