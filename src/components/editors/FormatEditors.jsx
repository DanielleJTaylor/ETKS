import { useState, useEffect, useCallback } from "react";
import { Works, WorkFiles, uploadToStorage } from "../../lib/api";

// ─── SHARED HELPERS ───────────────────────────────────────────────────────────
function parseChapterMeta(raw) {
  if (!raw) return [{ id: "ch1", title: "Chapter 1" }];
  try {
    const p = JSON.parse(raw);
    if (p.chapters && Array.isArray(p.chapters)) return p.chapters.map(c => ({ id: c.id, title: c.title }));
  } catch {}
  return [{ id: "ch1", title: "Chapter 1" }];
}

function saveChapterMeta(token, workId, chapters) {
  return Works.update(token, workId, { content: JSON.stringify({ chapters }) });
}

// ─── SHARED SIDEBAR ──────────────────────────────────────────────────────────
function ChapterSidebar({ chapters, activeIdx, onSwitch, onAdd, onRename, onDelete, workTitle, canEdit, onExitEdit }) {
  const [editingId, setEditingId] = useState(null);
  const [editVal, setEditVal]     = useState("");

  return (
    <div style={{ width: 200, background: "#2c2c2c", color: "#e0e0e0", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid #3a3a3a" }}>
        <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 12, fontWeight: 700, color: "#fff", lineHeight: 1.3, marginBottom: canEdit ? 8 : 0 }}>
          {workTitle}
        </div>
        {canEdit && onExitEdit && (
          <button onClick={onExitEdit}
            style={{ width: "100%", padding: "5px 8px", background: "#3a3a3a", border: "none", color: "#ccc", cursor: "pointer", fontSize: 11, textAlign: "left", borderRadius: 3 }}
            onMouseEnter={e => e.currentTarget.style.background = "#4a4a4a"}
            onMouseLeave={e => e.currentTarget.style.background = "#3a3a3a"}>
            ← Back to Viewer
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
        <div style={{ padding: "5px 14px 3px", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#666" }}>Chapters</div>
        {chapters.map((c, i) => (
          <div key={c.id} onClick={() => onSwitch(i)}
            style={{ padding: "7px 14px", cursor: "pointer", background: i === activeIdx ? "#3d3d3d" : "transparent", borderLeft: i === activeIdx ? "3px solid #c8001e" : "3px solid transparent", display: "flex", alignItems: "center", gap: 4 }}
            onMouseEnter={e => { if (i !== activeIdx) e.currentTarget.style.background = "#333"; }}
            onMouseLeave={e => { if (i !== activeIdx) e.currentTarget.style.background = "transparent"; }}>
            {editingId === c.id ? (
              <input autoFocus value={editVal}
                onChange={e => setEditVal(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { onRename(c.id, editVal); setEditingId(null); } if (e.key === "Escape") setEditingId(null); }}
                onBlur={() => { onRename(c.id, editVal); setEditingId(null); }}
                onClick={e => e.stopPropagation()}
                style={{ flex: 1, background: "#555", border: "1px solid #c8001e", color: "#fff", fontSize: 12, padding: "2px 5px", outline: "none", borderRadius: 2 }} />
            ) : (
              <span style={{ fontSize: 12, color: i === activeIdx ? "#fff" : "#bbb", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {i + 1}. {c.title}
              </span>
            )}
            {canEdit && editingId !== c.id && (
              <button onClick={e => { e.stopPropagation(); setEditingId(c.id); setEditVal(c.title); }}
                style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 11, padding: "1px 3px", flexShrink: 0 }} title="Rename">✏</button>
            )}
            {canEdit && chapters.length > 1 && editingId !== c.id && (
              <button onClick={e => { e.stopPropagation(); if (confirm(`Delete "${c.title}"?`)) onDelete(i); }}
                style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 13, padding: "1px 3px", flexShrink: 0 }} title="Delete">×</button>
            )}
          </div>
        ))}
      </div>

      {canEdit && (
        <button onClick={onAdd}
          style={{ padding: "9px 14px", background: "none", border: "none", borderTop: "1px solid #3a3a3a", color: "#888", cursor: "pointer", textAlign: "left", fontSize: 12, fontFamily: "inherit" }}
          onMouseEnter={e => e.currentTarget.style.color = "#ccc"} onMouseLeave={e => e.currentTarget.style.color = "#888"}>
          + Add Chapter
        </button>
      )}
    </div>
  );
}

// ─── COMIC SECTION ────────────────────────────────────────────────────────────
export function ComicSection({ work, canEdit, session }) {
  const [chapters, setChapters]   = useState(() => parseChapterMeta(work.content));
  const [activeIdx, setActiveIdx] = useState(0);
  const [files, setFiles]         = useState({});   // { chapterId: [file,...] }
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode]   = useState(false);
  const [error, setError]         = useState("");

  const ch = chapters[activeIdx];

  // Load all files grouped by chapter
  useEffect(() => {
    WorkFiles.fetch(work.id).then(({ data }) => {
      const grouped = {};
      (data || []).filter(f => f.file_type === "comic_page").forEach(f => {
        const cid = f.chapter_id || "ch1";
        if (!grouped[cid]) grouped[cid] = [];
        grouped[cid].push(f);
      });
      setFiles(grouped);
      setLoading(false);
    });
  }, [work.id]);

  const chFiles = files[ch?.id] || [];

  const addChapter = async () => {
    const newCh = { id: `ch${Date.now()}`, title: `Chapter ${chapters.length + 1}` };
    const updated = [...chapters, newCh];
    setChapters(updated);
    setActiveIdx(updated.length - 1);
    await saveChapterMeta(session.access_token, work.id, updated);
  };

  const renameChapter = async (id, title) => {
    const updated = chapters.map(c => c.id === id ? { ...c, title } : c);
    setChapters(updated);
    await saveChapterMeta(session.access_token, work.id, updated);
  };

  const deleteChapter = async (idx) => {
    const updated = chapters.filter((_, i) => i !== idx);
    setChapters(updated);
    setActiveIdx(Math.min(activeIdx, updated.length - 1));
    await saveChapterMeta(session.access_token, work.id, updated);
  };

  const handleUpload = async (fileList) => {
    if (!session) return;
    setUploading(true); setError("");
    const existing = chFiles.length;
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const path = `${work.id}/comic/${ch.id}/${Date.now()}_${i}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { url, error: err } = await uploadToStorage(session.access_token, "work-files", path, file);
      if (err) { setError(err); break; }
      const { data } = await WorkFiles.add(session.access_token, work.id, session.user.id, "comic_page", url, file.name, existing + i, ch.id);
      if (data) setFiles(prev => ({ ...prev, [ch.id]: [...(prev[ch.id] || []), data] }));
    }
    setUploading(false);
  };

  const deletePage = async (fileId) => {
    await WorkFiles.delete(session.access_token, fileId);
    setFiles(prev => ({ ...prev, [ch.id]: (prev[ch.id] || []).filter(f => f.id !== fileId) }));
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", border: "1px solid #ddd", minHeight: 500 }}>
      <ChapterSidebar chapters={chapters} activeIdx={activeIdx} onSwitch={setActiveIdx}
        onAdd={addChapter} onRename={renameChapter} onDelete={deleteChapter}
        workTitle={work.title} canEdit={canEdit}
        onExitEdit={canEdit && editMode ? () => setEditMode(false) : null} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Toolbar */}
        <div style={{ padding: "8px 16px", background: "#fff", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 15, fontWeight: 700 }}>{ch?.title}</span>
          {canEdit && (
            <button onClick={() => setEditMode(v => !v)} className="btn btn-sm" style={{ marginLeft: "auto" }}>
              {editMode ? "👁 View" : "✏️ Edit"}
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", background: "#f0eeeb", padding: 16 }}>
          {/* Editor */}
          {editMode && canEdit && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", border: "2px dashed #aaa", padding: "24px", textAlign: "center", cursor: "pointer", background: "#fff", borderRadius: 3 }}>
                <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => handleUpload(Array.from(e.target.files))} />
                <div style={{ fontSize: 24, marginBottom: 6 }}>🖼️</div>
                <div style={{ fontSize: 13, color: "#666" }}>{uploading ? "Uploading…" : "Click to upload pages for this chapter"}</div>
              </label>
              {error && <div className="warn-banner">{error}</div>}
            </div>
          )}

          {/* Viewer */}
          {chFiles.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#aaa", fontStyle: "italic" }}>No pages uploaded for this chapter yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "#1a1a1a", gap: 0 }}>
              {chFiles.map(p => (
                <div key={p.id} style={{ position: "relative", width: "100%", maxWidth: 800 }}>
                  <img src={p.file_url} alt={p.file_name || "page"} style={{ width: "100%", display: "block" }} />
                  {editMode && canEdit && (
                    <button onClick={() => deletePage(p.id)}
                      style={{ position: "absolute", top: 8, right: 8, background: "rgba(10,10,10,0.8)", color: "#fff", border: "none", cursor: "pointer", padding: "4px 10px", fontSize: 12, opacity: 0, transition: "opacity 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 1}
                      onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                      ✕ Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Chapter nav */}
          <ChapterNav idx={activeIdx} total={chapters.length} onPrev={() => setActiveIdx(i => Math.max(0, i-1))} onNext={() => setActiveIdx(i => Math.min(chapters.length-1, i+1))} />
        </div>
      </div>
    </div>
  );
}

// ─── PDF SECTION ──────────────────────────────────────────────────────────────
export function PDFSection({ work, canEdit, session }) {
  const [chapters, setChapters]   = useState(() => parseChapterMeta(work.content));
  const [activeIdx, setActiveIdx] = useState(0);
  const [files, setFiles]         = useState({});
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode]   = useState(false);
  const [staged, setStaged]       = useState(null);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState("");

  const ch = chapters[activeIdx];

  useEffect(() => {
    WorkFiles.fetch(work.id).then(({ data }) => {
      const grouped = {};
      (data || []).filter(f => f.file_type === "pdf").forEach(f => {
        grouped[f.chapter_id || "ch1"] = f;
      });
      setFiles(grouped);
      setLoading(false);
    });
  }, [work.id]);

  const currentFile = files[ch?.id];

  const addChapter = async () => {
    const newCh = { id: `ch${Date.now()}`, title: `Chapter ${chapters.length + 1}` };
    const updated = [...chapters, newCh];
    setChapters(updated);
    setActiveIdx(updated.length - 1);
    await saveChapterMeta(session.access_token, work.id, updated);
  };

  const renameChapter = async (id, title) => {
    const updated = chapters.map(c => c.id === id ? { ...c, title } : c);
    setChapters(updated);
    await saveChapterMeta(session.access_token, work.id, updated);
  };

  const deleteChapter = async (idx) => {
    const updated = chapters.filter((_, i) => i !== idx);
    setChapters(updated);
    setActiveIdx(Math.min(activeIdx, updated.length - 1));
    await saveChapterMeta(session.access_token, work.id, updated);
  };

  const upload = async () => {
    if (!staged || !session) return;
    setUploading(true); setError(""); setSaved(false);
    const path = `${work.id}/pdf/${ch.id}/${Date.now()}_${staged.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { url, error: err } = await uploadToStorage(session.access_token, "work-files", path, staged);
    if (err) { setError(err); setUploading(false); return; }
    if (currentFile) await WorkFiles.delete(session.access_token, currentFile.id);
    const { data, error: dbErr } = await WorkFiles.add(session.access_token, work.id, session.user.id, "pdf", url, staged.name, 0, ch.id);
    if (dbErr) { setError(dbErr); setUploading(false); return; }
    setFiles(prev => ({ ...prev, [ch.id]: data }));
    setStaged(null); setSaved(true); setUploading(false);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <Spinner />;

  const displayUrl = currentFile?.file_url;

  return (
    <div style={{ display: "flex", border: "1px solid #ddd", minHeight: 500 }}>
      <ChapterSidebar chapters={chapters} activeIdx={activeIdx} onSwitch={i => { setActiveIdx(i); setStaged(null); }}
        onAdd={addChapter} onRename={renameChapter} onDelete={deleteChapter}
        workTitle={work.title} canEdit={canEdit}
        onExitEdit={canEdit && editMode ? () => setEditMode(false) : null} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "8px 16px", background: "#fff", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 15, fontWeight: 700 }}>{ch?.title}</span>
          {canEdit && (
            <button onClick={() => setEditMode(v => !v)} className="btn btn-sm" style={{ marginLeft: "auto" }}>
              {editMode ? "👁 View" : "✏️ Edit"}
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", background: "#f0eeeb", padding: 16 }}>
          {editMode && canEdit && (
            <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <label className="btn btn-sm" style={{ cursor: "pointer" }}>
                <input type="file" accept="application/pdf" style={{ display: "none" }} onChange={e => { const f=e.target.files[0]; if(f&&f.type==="application/pdf"){setStaged(f);setError("");} else setError("Please select a PDF."); }} />
                📄 {currentFile ? "Replace PDF" : "Upload PDF"}
              </label>
              {staged && <button className="btn btn-primary btn-sm" onClick={upload} disabled={uploading}>{uploading?<><span className="spinner"/>Uploading…</>:"Save PDF"}</button>}
              {staged && <span style={{ fontSize: 13, color: "#666" }}>{staged.name}</span>}
              {saved && <span style={{ fontSize: 13, color: "#2e8b57", fontWeight: 600 }}>✓ Saved</span>}
              {currentFile && !staged && <span style={{ fontSize: 12, color: "#aaa", fontFamily: "monospace" }}>Current: {currentFile.file_name}</span>}
              {error && <span style={{ fontSize: 12, color: "#c8001e" }}>{error}</span>}
            </div>
          )}

          {!displayUrl ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#aaa", fontStyle: "italic" }}>No PDF uploaded for this chapter yet.</div>
          ) : (
            <div style={{ background: "#fff", border: "1px solid #ddd" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: "1px solid #eee", background: "#f9f9f9" }}>
                <span style={{ fontFamily: "monospace", fontSize: 11, color: "#666" }}>{currentFile?.file_name || "document.pdf"}</span>
                <a href={displayUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ marginLeft: "auto", textDecoration: "none" }}>⬇ Download</a>
              </div>
              <embed src={displayUrl} type="application/pdf" style={{ width: "100%", height: 700, display: "block", border: "none" }} />
            </div>
          )}

          <ChapterNav idx={activeIdx} total={chapters.length} onPrev={() => { setActiveIdx(i => Math.max(0,i-1)); setStaged(null); }} onNext={() => { setActiveIdx(i => Math.min(chapters.length-1,i+1)); setStaged(null); }} />
        </div>
      </div>
    </div>
  );
}

// ─── IMAGE GALLERY ────────────────────────────────────────────────────────────
export function ImageGallery({ work, canEdit, session }) {
  const [chapters, setChapters]   = useState(() => parseChapterMeta(work.content));
  const [activeIdx, setActiveIdx] = useState(0);
  const [files, setFiles]         = useState({});
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode]   = useState(false);
  const [error, setError]         = useState("");

  const ch = chapters[activeIdx];

  useEffect(() => {
    WorkFiles.fetch(work.id).then(({ data }) => {
      const grouped = {};
      (data || []).filter(f => f.file_type === "image").forEach(f => {
        const cid = f.chapter_id || "ch1";
        if (!grouped[cid]) grouped[cid] = [];
        grouped[cid].push(f);
      });
      setFiles(grouped);
      setLoading(false);
    });
  }, [work.id]);

  const chFiles = files[ch?.id] || [];

  const addChapter = async () => {
    const newCh = { id: `ch${Date.now()}`, title: `Gallery ${chapters.length + 1}` };
    const updated = [...chapters, newCh];
    setChapters(updated); setActiveIdx(updated.length - 1);
    await saveChapterMeta(session.access_token, work.id, updated);
  };

  const renameChapter = async (id, title) => {
    const updated = chapters.map(c => c.id === id ? { ...c, title } : c);
    setChapters(updated);
    await saveChapterMeta(session.access_token, work.id, updated);
  };

  const deleteChapter = async (idx) => {
    const updated = chapters.filter((_, i) => i !== idx);
    setChapters(updated); setActiveIdx(Math.min(activeIdx, updated.length - 1));
    await saveChapterMeta(session.access_token, work.id, updated);
  };

  const handleUpload = async (fileList) => {
    if (!session) return;
    setUploading(true); setError("");
    const existing = chFiles.length;
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const path = `${work.id}/gallery/${ch.id}/${Date.now()}_${i}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { url, error: err } = await uploadToStorage(session.access_token, "work-files", path, file);
      if (err) { setError(err); break; }
      const { data } = await WorkFiles.add(session.access_token, work.id, session.user.id, "image", url, file.name, existing + i, ch.id);
      if (data) setFiles(prev => ({ ...prev, [ch.id]: [...(prev[ch.id] || []), data] }));
    }
    setUploading(false);
  };

  const deleteImg = async (id) => {
    await WorkFiles.delete(session.access_token, id);
    setFiles(prev => ({ ...prev, [ch.id]: (prev[ch.id] || []).filter(f => f.id !== id) }));
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", border: "1px solid #ddd", minHeight: 500 }}>
      <ChapterSidebar chapters={chapters} activeIdx={activeIdx} onSwitch={setActiveIdx}
        onAdd={addChapter} onRename={renameChapter} onDelete={deleteChapter}
        workTitle={work.title} canEdit={canEdit}
        onExitEdit={canEdit && editMode ? () => setEditMode(false) : null} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "8px 16px", background: "#fff", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 15, fontWeight: 700 }}>{ch?.title}</span>
          {canEdit && (
            <button onClick={() => setEditMode(v => !v)} className="btn btn-sm" style={{ marginLeft: "auto" }}>
              {editMode ? "👁 View" : "✏️ Edit"}
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", background: "#f0eeeb", padding: 16 }}>
          {editMode && canEdit && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", border: "2px dashed #aaa", padding: "24px", textAlign: "center", cursor: "pointer", background: "#fff", borderRadius: 3 }}>
                <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => handleUpload(Array.from(e.target.files))} />
                <div style={{ fontSize: 24, marginBottom: 6 }}>🖼️</div>
                <div style={{ fontSize: 13, color: "#666" }}>{uploading ? "Uploading…" : "Click to upload images for this gallery"}</div>
              </label>
              {error && <div className="warn-banner">{error}</div>}
            </div>
          )}

          {chFiles.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#aaa", fontStyle: "italic" }}>No images in this gallery yet.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 8 }}>
              {chFiles.map(img => (
                <div key={img.id} style={{ position: "relative", aspectRatio: "1", overflow: "hidden", border: "1px solid #ddd", background: "#f5f5f5" }}>
                  <img src={img.file_url} alt={img.file_name || "image"} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  {editMode && canEdit && (
                    <button onClick={() => deleteImg(img.id)}
                      style={{ position: "absolute", top: 4, right: 4, background: "rgba(10,10,10,0.8)", color: "#fff", border: "none", cursor: "pointer", padding: "2px 6px", fontSize: 11, opacity: 0, transition: "opacity 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 1}
                      onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <ChapterNav idx={activeIdx} total={chapters.length} onPrev={() => setActiveIdx(i => Math.max(0,i-1))} onNext={() => setActiveIdx(i => Math.min(chapters.length-1,i+1))} />
        </div>
      </div>
    </div>
  );
}

// ─── SHARED SUBCOMPONENTS ─────────────────────────────────────────────────────
function ChapterNav({ idx, total, onPrev, onNext }) {
  if (total <= 1) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, padding: "10px 0" }}>
      <button className="btn btn-sm" onClick={onPrev} disabled={idx === 0}>← Previous</button>
      <span style={{ fontSize: 12, color: "#aaa", fontFamily: "monospace" }}>{idx + 1} / {total}</span>
      <button className="btn btn-primary btn-sm" onClick={onNext} disabled={idx === total - 1}>Next →</button>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, gap: 10, color: "#aaa", fontSize: 13 }}>
      <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #aaa", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      Loading…
    </div>
  );
}