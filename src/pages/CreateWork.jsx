import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { Works } from "../lib/api";
import TagInput from "../components/TagInput";

const FORMATS = [
  { id: "prose",          name: "Prose",           desc: "Text, chapters & scenes" },
  { id: "comic",          name: "Comic",           desc: "Vertical scroll images" },
  { id: "visual-novel",   name: "Visual Novel",    desc: "Scenes with images & text" },
  { id: "pdf",            name: "PDF",             desc: "Documents & guides" },
  { id: "recipe",         name: "Recipe",          desc: "Ingredients, steps & tags" },
  { id: "other",          name: "Gallery / Other", desc: "Images & misc" },
];

export default function CreateWork() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle]       = useState("");
  const [description, setDesc]  = useState("");
  const [format, setFormat]     = useState("");
  const [tags, setTags]         = useState([]);
  const [visibility, setVis]    = useState("private");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  if (!session) return (
    <div style={{ textAlign: "center", padding: "80px 24px" }}>
      <p style={{ color: "var(--gray-600)", marginBottom: 16 }}>Sign in to create a work.</p>
      <Link to="/" className="btn btn-primary">Go Home</Link>
    </div>
  );

  const addTag = (val) => {
    const clean = val.trim().toLowerCase().replace(/\s+/g, " ");
    if (!clean) return;
    if (clean.split(" ").length > 3) return setError("Tags must be 1–3 words max.");
    if (tags.includes(clean)) return;
    if (tags.length >= 20) return setError("Maximum 20 tags.");
    setTags([...tags, clean]); setError("");
  };

  const submit = async () => {
    setError("");
    if (!title.trim()) return setError("Title is required.");
    if (!format) return setError("Select a format.");
    setLoading(true);
    const { data, error: err } = await Works.create(session.access_token, session.user.id, {
      title: title.trim(), description: description.trim(), format, tags, visibility,
    });
    setLoading(false);
    if (err) return setError(err);
    navigate(`/works/${data.id}`);
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px 80px" }}>
      <div style={{ padding: "36px 0 28px", borderBottom: "var(--border)", marginBottom: 28 }}>
        <Link to="/dashboard" className="back-btn" style={{ marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 6 }}>← Back to dashboard</Link>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 28, fontWeight: 700 }}>New Work</div>
        <div style={{ fontSize: 13, color: "var(--gray-400)", marginTop: 4 }}>Works start private by default. You can add content after publishing.</div>
      </div>

      <div className="form-section">
        <div className="section-mono">Basics</div>
        <div className="field">
          <label className="label">Title <span style={{ color: "var(--red)" }}>*</span></label>
          <input className="input" type="text" placeholder="What's this work called?" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label className="label">Description / Summary</label>
          <textarea className="input" placeholder="Short summary or logline (optional)…" value={description} onChange={e => setDesc(e.target.value)} />
        </div>
      </div>

      <div className="form-section">
        <div className="section-mono">Format <span style={{ color: "var(--red)" }}>*</span></div>
        <div className="format-grid">
          {FORMATS.map(f => (
            <button key={f.id} className={`format-option ${format === f.id ? "selected" : ""}`} onClick={() => setFormat(f.id)}>
              <span className="format-option-name">{f.name}</span>
              <span className="format-option-desc">{f.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="form-section">
        <div className="section-mono">Tags</div>
        <label className="label">Add Tags <span style={{ color: "var(--gray-400)", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>— 1–3 words each, max 20</span></label>
        <div className="tags-input-wrap">
          <TagInput placeholder="e.g. fantasy, horror, D&D 5e…" onAdd={addTag} />
        </div>
        {tags.length > 0 && (
          <div className="tags-list">
            {tags.map(t => <span className="tag-item" key={t}>{t}<button className="tag-remove" onClick={() => setTags(tags.filter(x => x !== t))}>×</button></span>)}
          </div>
        )}
      </div>

      <div className="form-section">
        <div className="section-mono">Visibility</div>
        <div className="vis-toggle">
          <button className={`vis-option ${visibility === "private" ? "selected" : ""}`} onClick={() => setVis("private")}>🔒 Private</button>
          <button className={`vis-option ${visibility === "public" ? "selected" : ""}`} onClick={() => setVis("public")}>🌐 Public</button>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: "var(--gray-400)", lineHeight: 1.5 }}>
          {visibility === "private" ? "Only you can see this. Change anytime from the work page or dashboard." : "Anyone can discover this through browse and search."}
        </div>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-primary" onClick={submit} disabled={loading} style={{ flex: 1, padding: "13px" }}>
          {loading ? <><span className="spinner" /> Creating…</> : `Create as ${visibility}`}
        </button>
        <Link to="/dashboard" className="btn">Cancel</Link>
      </div>
    </div>
  );
}