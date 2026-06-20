import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { Works } from "../lib/api";

const FORMATS = [
  { id: "prose",          name: "Prose",           desc: "Text, chapters & scenes" },
  { id: "comic",          name: "Comic",           desc: "Vertical scroll images" },
  { id: "visual-novel",   name: "Visual Novel",    desc: "Scenes with images & text" },
  { id: "pdf",            name: "PDF",             desc: "Documents & guides" },
  { id: "recipe",         name: "Recipe",          desc: "Ingredients, steps & tags" },
  { id: "other",          name: "Gallery / Other", desc: "Images & misc" },
];

export default function EditWork() {
  const { id } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();

  const [work, setWork]         = useState(null);
  const [title, setTitle]       = useState("");
  const [description, setDesc]  = useState("");
  const [format, setFormat]     = useState("");
  const [tags, setTags]         = useState([]);
  const [visibility, setVis]    = useState("private");
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    Works.fetchOne(id, session?.access_token).then(({ data, error: err }) => {
      if (err || !data) { setError("Work not found."); setLoading(false); return; }
      if (data.user_id !== session?.user?.id) { setError("You don't own this work."); setLoading(false); return; }
      setWork(data);
      setTitle(data.title || "");
      setDesc(data.description || "");
      setFormat(data.format || "");
      setTags(data.tags || []);
      setVis(data.visibility || "private");
      setLoading(false);
    });
  }, [id, session]);

  const save = async () => {
    setError("");
    if (!title.trim()) return setError("Title is required.");
    if (!format) return setError("Select a format.");
    setSaving(true);
    const { error: err } = await Works.update(session.access_token, work.id, {
      title: title.trim(),
      description: description.trim() || null,
      format,
      tags,
      visibility,
    });
    setSaving(false);
    if (err) return setError(err);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const saveAndReturn = async () => {
    setError("");
    if (!title.trim()) return setError("Title is required.");
    if (!format) return setError("Select a format.");
    setSaving(true);
    const { error: err } = await Works.update(session.access_token, work.id, {
      title: title.trim(), description: description.trim() || null, format, tags, visibility,
    });
    setSaving(false);
    if (err) return setError(err);
    navigate(`/works/${work.id}`);
  };

  if (!session) return <div style={{ textAlign: "center", padding: "80px 24px" }}><p style={{ color: "var(--gray-600)" }}>Sign in to edit works.</p></div>;
  if (loading) return <div className="page-loading"><span className="spinner" style={{ borderColor: "var(--gray-400)", borderTopColor: "transparent" }} />Loading…</div>;
  if (error && !work) return <div style={{ textAlign: "center", padding: "80px 24px" }}><p style={{ color: "var(--gray-600)", marginBottom: 16 }}>{error}</p><Link to="/dashboard" className="btn">← Dashboard</Link></div>;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px 80px" }}>
      <div style={{ padding: "36px 0 28px", borderBottom: "var(--border)", marginBottom: 28 }}>
        <Link to={`/works/${id}`} className="back-btn" style={{ marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 6 }}>← Back to work</Link>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 28, fontWeight: 700 }}>Edit Work</div>
        <div style={{ fontSize: 13, color: "var(--gray-400)", marginTop: 4 }}>Changes save immediately. Changing format does not delete existing content.</div>
      </div>

      {saved && <div className="success-banner">✓ Changes saved.</div>}

      <div className="form-section">
        <div className="section-mono">Basics</div>
        <div className="field">
          <label className="label">Title <span style={{ color: "var(--red)" }}>*</span></label>
          <input className="input" type="text" placeholder="Work title" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label className="label">Description / Summary</label>
          <textarea className="input" placeholder="Short summary or logline…" value={description} onChange={e => setDesc(e.target.value)} />
        </div>
      </div>

      <div className="form-section">
        <div className="section-mono">Format</div>
        <div className="format-grid">
          {FORMATS.map(f => (
            <button key={f.id} className={`format-option ${format === f.id ? "selected" : ""}`} onClick={() => setFormat(f.id)}>
              <span className="format-option-name">{f.name}</span>
              <span className="format-option-desc">{f.desc}</span>
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 8, lineHeight: 1.5 }}>
          Changing format only changes how the work page looks. Uploaded files and saved text are preserved.
        </div>
      </div>

      <div className="form-section">
        <div className="section-mono">Visibility</div>
        <div className="vis-toggle">
          <button className={`vis-option ${visibility === "private" ? "selected" : ""}`} onClick={() => setVis("private")}>🔒 Private</button>
          <button className={`vis-option ${visibility === "public" ? "selected" : ""}`} onClick={() => setVis("public")}>🌐 Public</button>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: "var(--gray-400)", lineHeight: 1.5 }}>
          {visibility === "private" ? "Only you can see this work." : "Anyone can find and read this work."}
        </div>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="btn btn-primary" onClick={saveAndReturn} disabled={saving} style={{ flex: 1, padding: "13px" }}>
          {saving ? <><span className="spinner" /> Saving…</> : "Save & Return to Work"}
        </button>
        <button className="btn" onClick={save} disabled={saving}>Save</button>
        <Link to={`/works/${id}`} className="btn btn-ghost">Cancel</Link>
      </div>
    </div>
  );
}