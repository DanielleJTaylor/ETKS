import { useState, useEffect } from "react";
import { Works, WorkFiles, uploadToStorage } from "../../lib/api";

// ─── COMIC SECTION ────────────────────────────────────────────────────────────
export function ComicSection({ work, isOwner, session }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    WorkFiles.fetch(work.id).then(({ data }) => {
      setPages(data.filter(f => f.file_type === "comic_page"));
      setLoading(false);
    });
  }, [work.id]);

  const handleFiles = async (files) => {
    if (!session) return;
    setUploading(true); setError("");
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const path = `${work.id}/comic/${Date.now()}_${i}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { url, error: err } = await uploadToStorage(session.access_token, "work-files", path, file);
      if (err) { setError(err); break; }
      if (url) {
        const { data } = await WorkFiles.add(session.access_token, work.id, session.user.id, "comic_page", url, file.name, pages.length + i);
        if (data) setPages(prev => [...prev, data]);
      }
    }
    setUploading(false);
  };

  const deletePage = async (fileId) => {
    await WorkFiles.delete(session.access_token, fileId);
    setPages(prev => prev.filter(p => p.id !== fileId));
  };

  if (loading) return <div className="page-loading"><span className="spinner" style={{ borderColor: "var(--gray-400)", borderTopColor: "transparent" }} />Loading…</div>;

  return (
    <div>
      {error && <div className="warn-banner">⚠ {error}</div>}
      {isOwner && (
        <label className="upload-drop-zone" style={{ display: "block", marginBottom: 16 }}>
          <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => handleFiles(Array.from(e.target.files))} />
          <div style={{ fontSize: 32 }}>🖼️</div>
          <div className="upload-drop-label">{uploading ? <><span className="spinner" /> Uploading…</> : "Click or drag to upload comic pages. They appear in order below."}</div>
        </label>
      )}
      {pages.length === 0 && !isOwner && <div style={{ color: "var(--gray-400)", fontStyle: "italic", fontSize: 14 }}>No pages uploaded yet.</div>}
      {pages.length > 0 && (
        <div className="comic-strip">
          {pages.map(p => (
            <div className="comic-page-wrap" key={p.id}>
              <img className="comic-page" src={p.file_url} alt={p.file_name || "page"} />
              {isOwner && <button className="comic-page-delete" onClick={() => deletePage(p.id)}>✕ Remove</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PDF SECTION ──────────────────────────────────────────────────────────────
export function PDFSection({ work, isOwner, session }) {
  const [file, setFile]           = useState(null);
  const [dbFile, setDbFile]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState("");

  useEffect(() => {
    WorkFiles.fetch(work.id).then(({ data }) => {
      const pdf = data.find(f => f.file_type === "pdf");
      if (pdf) setDbFile(pdf);
      setLoading(false);
    });
  }, [work.id]);

  const handleFile = (f) => {
    if (!f || f.type !== "application/pdf") { setError("Please select a PDF file."); return; }
    setFile(f); setError("");
  };

  const upload = async () => {
    if (!file || !session) return;
    setUploading(true); setError(""); setSaved(false);
    const path = `${work.id}/pdf/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { url, error: err } = await uploadToStorage(session.access_token, "work-files", path, file);
    if (err) { setError("Storage error: " + err + " — Make sure the work-files bucket exists and is public."); setUploading(false); return; }
    if (dbFile) await WorkFiles.delete(session.access_token, dbFile.id);
    const { data, error: dbErr } = await WorkFiles.add(session.access_token, work.id, session.user.id, "pdf", url, file.name);
    if (dbErr) { setError("Database error: " + dbErr); setUploading(false); return; }
    setDbFile(data);
    setFile(null);
    setSaved(true);
    setUploading(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const displayUrl = dbFile?.file_url;

  if (loading) return <div className="page-loading"><span className="spinner" style={{ borderColor: "var(--gray-400)", borderTopColor: "transparent" }} />Loading…</div>;

  return (
    <div>
      {error && <div className="warn-banner">⚠ {error}</div>}
      {isOwner && (
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <label className="btn" style={{ cursor: "pointer" }}>
            <input type="file" accept="application/pdf" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
            📄 {dbFile ? "Replace PDF" : "Upload PDF"}
          </label>
          {file && (
            <button className="btn btn-primary" onClick={upload} disabled={uploading}>
              {uploading ? <><span className="spinner" /> Uploading…</> : "Save PDF"}
            </button>
          )}
          {file && <span style={{ fontSize: 13, color: "var(--gray-600)" }}>{file.name}</span>}
          {saved && <span style={{ fontSize: 13, color: "#2e8b57", fontWeight: 600 }}>✓ PDF saved — reload to confirm</span>}
          {dbFile && !file && <span style={{ fontSize: 12, color: "var(--gray-400)", fontFamily: "var(--font-mono)" }}>Saved: {dbFile.file_name}</span>}
        </div>
      )}
      {!displayUrl && !isOwner && <div style={{ color: "var(--gray-400)", fontStyle: "italic", fontSize: 14 }}>No PDF uploaded yet.</div>}
      {displayUrl && (
        <div className="pdf-viewer-wrap">
          <div className="pdf-viewer-bar">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--gray-600)", fontWeight: 600 }}>{dbFile?.file_name || file?.name || "document.pdf"}</span>
            <a className="btn btn-primary btn-sm" style={{ marginLeft: "auto", textDecoration: "none" }} href={displayUrl} target="_blank" rel="noreferrer">⬇ Download PDF</a>
          </div>
          <embed className="pdf-embed" src={displayUrl} type="application/pdf" />
        </div>
      )}
    </div>
  );
}

// ─── IMAGE GALLERY ────────────────────────────────────────────────────────────
export function ImageGallery({ work, isOwner, session }) {
  const [images, setImages]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    WorkFiles.fetch(work.id).then(({ data }) => {
      setImages(data.filter(f => f.file_type === "image"));
      setLoading(false);
    });
  }, [work.id]);

  const handleFiles = async (files) => {
    if (!session) return;
    setUploading(true); setError("");
    for (const file of files) {
      const path = `${work.id}/images/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { url, error: err } = await uploadToStorage(session.access_token, "work-files", path, file);
      if (err) { setError(err); break; }
      if (url) {
        const { data } = await WorkFiles.add(session.access_token, work.id, session.user.id, "image", url, file.name, images.length);
        if (data) setImages(prev => [...prev, data]);
      }
    }
    setUploading(false);
  };

  const deleteImg = async (id) => {
    await WorkFiles.delete(session.access_token, id);
    setImages(prev => prev.filter(i => i.id !== id));
  };

  if (loading) return <div className="page-loading"><span className="spinner" style={{ borderColor: "var(--gray-400)", borderTopColor: "transparent" }} />Loading…</div>;

  return (
    <div>
      {error && <div className="warn-banner">⚠ {error}</div>}
      {isOwner && (
        <label className="upload-drop-zone" style={{ display: "block", marginBottom: 16 }}>
          <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => handleFiles(Array.from(e.target.files))} />
          <div style={{ fontSize: 32 }}>🖼️</div>
          <div className="upload-drop-label">{uploading ? <><span className="spinner" /> Uploading…</> : "Click to upload images."}</div>
        </label>
      )}
      {images.length === 0 && !isOwner && <div style={{ color: "var(--gray-400)", fontStyle: "italic", fontSize: 14 }}>No images uploaded yet.</div>}
      <div className="image-grid">
        {images.map(img => (
          <div className="image-grid-item" key={img.id}>
            <img src={img.file_url} alt={img.file_name || "image"} />
            {isOwner && <button className="image-grid-delete" onClick={() => deleteImg(img.id)}>✕</button>}
          </div>
        ))}
      </div>
    </div>
  );
}