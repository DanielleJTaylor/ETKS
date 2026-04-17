import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { Works } from "../lib/api";

export default function Dashboard() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [works, setWorks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const { data, error: err } = await Works.fetchMine(session.access_token);
    setLoading(false);
    if (err) setError(err); else setWorks(data);
  }, [session]);

  useEffect(() => { load(); }, [load]);

  const toggleVis = async (e, work) => {
    e.stopPropagation();
    const next = work.visibility === "private" ? "public" : "private";
    const { error: err } = await Works.update(session.access_token, work.id, { visibility: next });
    if (!err) setWorks(prev => prev.map(w => w.id === work.id ? { ...w, visibility: next } : w));
  };

  const remove = async (e, workId) => {
    e.stopPropagation();
    if (!confirm("Delete this work? This cannot be undone.")) return;
    const { error: err } = await Works.delete(session.access_token, workId);
    if (!err) setWorks(prev => prev.filter(w => w.id !== workId));
  };

  if (!session) return (
    <div style={{ textAlign: "center", padding: "80px 24px" }}>
      <p style={{ marginBottom: 16, color: "var(--gray-600)" }}>Sign in to view your works.</p>
    </div>
  );

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <div className="page-title">My Works</div>
          <div className="page-sub">{loading ? "Loading…" : `${works.length} work${works.length !== 1 ? "s" : ""} in your archive`}</div>
        </div>
        <Link to="/create" className="btn btn-primary">+ New Work</Link>
      </div>

      {loading && <div className="page-loading"><span className="spinner" style={{ borderColor: "var(--gray-400)", borderTopColor: "transparent" }} />Loading your works…</div>}
      {!loading && error && <div className="info-banner">⚠ {error}</div>}

      {!loading && !error && works.length === 0 && (
        <div style={{ padding: "64px 0", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>📂</div>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Your archive is empty</div>
          <div style={{ fontSize: 14, color: "var(--gray-400)", marginBottom: 24 }}>Publish your first work to get started.</div>
          <Link to="/create" className="btn btn-primary">Create First Work</Link>
        </div>
      )}

      {!loading && works.map(w => (
        <div className="work-card" key={w.id} onClick={() => navigate(`/works/${w.id}`)}>
          <div className="work-card-left">
            <div className="work-card-title">{w.title}</div>
            <div className="work-card-meta">
              {new Date(w.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              {w.description && ` · ${w.description.slice(0, 60)}${w.description.length > 60 ? "…" : ""}`}
            </div>
            <div className="work-tags">
              {(w.tags || []).slice(0, 6).map(t => <span className="tag-chip" key={t}>{t}</span>)}
              {(w.tags || []).length > 6 && <span className="tag-chip">+{w.tags.length - 6}</span>}
            </div>
          </div>
          <div className="work-card-right">
            <span className="format-badge">{w.format}</span>
            <span className={`vis-badge ${w.visibility}`} onClick={e => toggleVis(e, w)} style={{ cursor: "pointer" }}
              title={`Click to make ${w.visibility === "private" ? "public" : "private"}`}>
              {w.visibility === "private" ? "🔒 Private" : "🌐 Public"}
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              <button className="card-action-btn" onClick={e => { e.stopPropagation(); navigate(`/works/${w.id}/edit`); }}>Edit</button>
              <button className="card-action-btn danger" onClick={e => remove(e, w.id)}>Delete</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
