import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { Works, Reactions, Comments } from "../lib/api";
import { matchTags } from "../lib/tags";

const SORT_OPTIONS = [
  { id: "recent",   label: "Recent"        },
  { id: "oldest",   label: "Oldest"        },
  { id: "liked",    label: "Most Liked"    },
  { id: "disliked", label: "Most Disliked" },
  { id: "comments", label: "Most Comments" },
];

function applySort(data, sort, cc = {}) {
  const d = [...data];
  if (sort === "recent")   return d.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  if (sort === "oldest")   return d.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  if (sort === "liked")    return d.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
  if (sort === "disliked") return d.sort((a, b) => (b.dislike_count || 0) - (a.dislike_count || 0));
  if (sort === "comments") return d.sort((a, b) => (cc[b.id] || 0) - (cc[a.id] || 0));
  return d;
}

function FilterRow({ op, description, tags, onAdd, onRemove }) {
  const wrapRef = useRef(null);
  const [val, setVal] = useState(""); const [sugg, setSugg] = useState([]); const [focused, setFocused] = useState(false);
  useEffect(() => { setSugg(val.length >= 2 ? matchTags(val) : []); }, [val]);
  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setFocused(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  const commit = (tag) => { const c = (tag || val).trim().toLowerCase().replace(/\s+/g, " "); if (!c) return; onAdd(c); setVal(""); setSugg([]); };
  return (
    <div className="filter-row">
      <div className="filter-row-label">
        <span className={`filter-row-label-badge ${op}`}>{op === "exclude" ? "Exclude" : op === "or" ? "Either / Or" : "Must Have"}</span>
        <span className="filter-row-label-text">{description}</span>
      </div>
      <div className="filter-row-body">
        {tags.map(t => <span key={t} className={`filter-tag ${op}`}>{t}<button className="filter-tag-remove" onClick={() => onRemove(t)}>×</button></span>)}
        <div ref={wrapRef} style={{ position: "relative" }}>
          <input className="filter-inline-input" type="text" placeholder="Add tag…" value={val}
            onChange={e => setVal(e.target.value)} onFocus={() => setFocused(true)}
            onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commit(); } if (e.key === "Escape") { setSugg([]); setFocused(false); } }} />
          {focused && sugg.length > 0 && (
            <div className="tag-suggestions">
              {sugg.map(s => <button key={s} className="tag-sugg-item" onMouseDown={e => { e.preventDefault(); commit(s); setFocused(false); }}>{s}</button>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Browse() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [andTags, setAnd] = useState([]); const [orTags, setOr] = useState([]); const [excludeTags, setEx] = useState([]);
  const [allResults, setAll] = useState([]); const [sort, setSort] = useState("recent");
  const [loading, setLoading] = useState(false); const [searched, setSearched] = useState(false);
  const [error, setError] = useState(""); const [myReacts, setMyReacts] = useState({}); const [reactCounts, setRC] = useState({});
  const [commentCounts, setCC] = useState({});

  const addTo = (s) => (t) => s(p => p.includes(t) ? p : [...p, t]);
  const rmFrom = (s) => (t) => s(p => p.filter(x => x !== t));

  const runSearch = useCallback(async (a, o, e) => {
    setLoading(true); setError("");
    const { data, error: err } = await Works.fetchPublic({ andTags: a, orTags: o, excludeTags: e });
    setLoading(false); setSearched(true);
    if (err) { setError(err); return; }
    setAll(data);
    const rc = {}; for (const w of data) rc[w.id] = { likes: w.like_count || 0, dislikes: w.dislike_count || 0 };
    setRC(rc);
    if (data.length > 0) {
      const cc = await Comments.fetchCounts(data.map(w => w.id));
      setCC(cc);
      if (session?.access_token) {
        const mine = await Reactions.fetchMine(session.access_token, data.map(w => w.id));
        setMyReacts(mine);
      }
    }
  }, [session]);

  useEffect(() => { runSearch([], [], []); }, [runSearch]);

  const doSearch = () => runSearch(andTags, orTags, excludeTags);
  const clearAll = () => { setAnd([]); setOr([]); setEx([]); runSearch([], [], []); };

  const handleReact = async (e, workId, reaction) => {
    e.stopPropagation(); if (!session) return;
    const cur = myReacts[workId]; const next = cur === reaction ? null : reaction;
    setMyReacts(p => ({ ...p, [workId]: next }));
    setRC(p => { const c = { ...(p[workId] || { likes: 0, dislikes: 0 }) }; if (cur === "like") c.likes = Math.max(0, c.likes - 1); if (cur === "dislike") c.dislikes = Math.max(0, c.dislikes - 1); if (next === "like") c.likes += 1; if (next === "dislike") c.dislikes += 1; return { ...p, [workId]: c }; });
    await Reactions.react(session.access_token, session.user.id, workId, next);
  };

  const results = applySort(allResults, sort, commentCounts);

  return (
    <div className="browse-wrap">
      <div style={{ padding: "32px 0 24px", borderBottom: "var(--border)", marginBottom: 28 }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 38, letterSpacing: "0.5px" }}>Browse Works</div>
        <div style={{ fontSize: 13, color: "var(--gray-400)", marginTop: 4 }}>All public works in the archive. Filter by tags or sort to find what you want.</div>
      </div>

      <div className="search-builder">
        <div className="search-builder-header"><span className="search-builder-title">Tag Filter</span><button className="text-link" style={{ fontSize: 11 }} onClick={clearAll}>Clear all</button></div>
        <FilterRow op="and" description="Results must include all of these tags" tags={andTags} onAdd={addTo(setAnd)} onRemove={rmFrom(setAnd)} />
        <FilterRow op="or"  description="Results match any one of these tags"   tags={orTags}  onAdd={addTo(setOr)}  onRemove={rmFrom(setOr)} />
        <FilterRow op="exclude" description="Results must not include these tags" tags={excludeTags} onAdd={addTo(setEx)} onRemove={rmFrom(setEx)} />
        <div className="search-actions">
          <button className="btn btn-primary" onClick={doSearch} disabled={loading}>{loading ? <><span className="spinner" /> Searching…</> : "Search"}</button>
          {searched && !loading && <span style={{ fontSize: 12, color: "var(--gray-400)", marginLeft: 4 }}>{results.length} work{results.length !== 1 ? "s" : ""}</span>}
        </div>
      </div>

      {error && <div className="info-banner">⚠ {error}</div>}
      {loading && <div className="page-loading"><span className="spinner" style={{ borderColor: "var(--gray-400)", borderTopColor: "transparent" }} />Loading works…</div>}

      {!loading && searched && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <div className="sort-select-wrap">
              <span className="sort-label">Sort by</span>
              <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
                {SORT_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            {!session && <span style={{ fontSize: 12, color: "var(--gray-400)" }}>Sign in to like or dislike works.</span>}
          </div>

          {results.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 30, color: "var(--red)", marginBottom: 12 }}>?</div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, letterSpacing: "0.3px", marginBottom: 6 }}>No results</div>
              <div style={{ fontSize: 13, color: "var(--gray-400)" }}>No public works yet, or no matches for your filters.</div>
            </div>
          )}

          {results.map(w => {
            const counts = reactCounts[w.id] || { likes: 0, dislikes: 0 }; const myR = myReacts[w.id];
            return (
              <div className="browse-card" key={w.id} onClick={() => navigate(`/works/${w.id}`)}>
                <div className="browse-card-top"><div className="browse-card-title">{w.title}</div><span className="format-badge">{w.format}</span></div>
                {w.description && <div className="browse-card-desc">{w.description}</div>}
                <div className="browse-card-bottom">
                  <div className="browse-tags">{(w.tags || []).map(t => <span className="tag-chip" key={t}>{t}</span>)}</div>
                  <div className="browse-reactions">
                    <button className={`reaction-btn ${myR === "like" ? "active-like" : ""}`} onClick={e => handleReact(e, w.id, "like")} disabled={!session} title={session ? "Like" : "Sign in"}>👍 {counts.likes}</button>
                    <button className={`reaction-btn ${myR === "dislike" ? "active-dislike" : ""}`} onClick={e => handleReact(e, w.id, "dislike")} disabled={!session} title={session ? "Dislike" : "Sign in"}>👎 {counts.dislikes}</button>
                    <span style={{ fontSize: 11, color: "var(--gray-400)", fontFamily: "var(--font-mono)", padding: "5px 8px" }}>💬 {commentCounts[w.id] || 0}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
