"use client";
import { Image, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";

type Props = {
  label: string;
  value?: string | null;
  onChange: (value: string) => void;
  onPick?: () => void;
};

export function ImageField({ label, value, onChange, onPick }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setUploading(true);
    setError("");
    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/admin/upload", { method: "POST", body });
    const data = await response.json();
    setUploading(false);
    if (!response.ok) {
      setError(data.error || "No se pudo subir la imagen.");
      return;
    }
    onChange(data.url);
  }

  return <div className="field field-full image-config-field">
    <label>{label}</label>
    <div className="image-config-row">
      <div className="image-config-preview">
        {value ? <img src={value} alt={label} /> : <span>Sin imagen</span>}
      </div>
      <div className="image-config-actions">
        <button type="button" className="button image-picker-trigger" disabled={uploading} onClick={() => inputRef.current?.click()}>
          <Upload size={15} /> {uploading ? "Subiendo..." : "Subir nueva imagen"}
        </button>
        {onPick && <button type="button" className="button button-outline" onClick={onPick}>
          <Image size={15} /> Elegir existente
        </button>}
        {value && <button type="button" className="button button-outline" onClick={() => onChange("")}>
          <Trash2 size={15} /> Quitar imagen
        </button>}
      </div>
      <input ref={inputRef} hidden type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])} />
      <input placeholder="URL de la imagen" value={value || ""} onChange={(event) => onChange(event.target.value)} />
    </div>
    {error && <p className="error">{error}</p>}
  </div>;
}
