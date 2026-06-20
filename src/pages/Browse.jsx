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

const FORMAT_OPTIONS = [
  { id: "prose",        label: "Prose" },
  { id: "comic",        label: "Comic"         },
  { id: "visual-novel", label: "Visual Novel"  },
  { id: "pdf",          label: "PDF"           },
  { id: "recipe",       label: "Recipe"        },
  { id: "other",        label: "Gallery / Other" },
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

// Fuzzy match: checks if query words appear (in any order) across title, description, and tags
// Also handles common shorthand aliases — "mac" matches "macaroni", "dnd" matches "d&d", etc.
const ALIASES = {
  "mac": ["macaroni", "mac and cheese", "mac & cheese"],
  "dnd": ["d&d", "dungeons and dragons", "dungeons & dragons", "5e", "pathfinder"],
  "d&d": ["dungeons and dragons", "dnd", "5e"],
  "scifi": ["sci-fi", "science fiction"],
  "sci fi": ["sci-fi", "science fiction"],
  "vn": ["visual novel"],
  "fic": ["fanfiction", "fiction"],
};

function fuzzyMatch(work, query) {
  if (!query.trim()) return true;
  const q = query.toLowerCase().trim();
  const haystack = [
    work.title || "",
    work.description || "",
    ...(work.tags || []),
    work.format || "",
  ].join(" ").toLowerCase();

  // Check aliases — expand query with related terms
  const expanded = [q, ...(ALIASES[q] || [])];
  for (const term of expanded) {
    if (haystack.includes(term)) return true;
  }

  // Multi-word: every word must appear somewhere
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    return words.every(w => {
      const wordAliases = [w, ...(ALIASES[w] || [])];
      return wordAliases.some(a => haystack.includes(a));
    });
  }

  return false;
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

const FORMAT_ICON = {
  prose: "📖", comic: "🖼️", "visual-novel": "🎬", pdf: "📄", recipe: "🍳", other: "🗂️",
};

// Mirrors the dietary sub-tag set in RecipeEditor.jsx — a diet only applies
// to the whole recipe if no ingredient explicitly breaks it.
const DIET_TAGS = [
  { id: "gluten-free", label: "Gluten-Free" },
  { id: "dairy-free",  label: "Dairy-Free"  },
  { id: "egg-free",    label: "Egg-Free"    },
  { id: "nut-free",    label: "Nut-Free"    },
  { id: "soy-free",    label: "Soy-Free"    },
  { id: "vegan",       label: "Vegan"       },
];

// Extracts the display name from a stored ingredient — handles both the
// current single-line format and the legacy quantity/unit/name format.
function ingredientNameOf(ing) {
  const line = ing.line ?? [ing.quantity ?? [ing.amount, ing.unit].filter(Boolean).join(" "), ing.name].filter(Boolean).join(" ").trim();
  const m = line.match(/^(\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?\s*(?:tsp|tbsp|cup|cups|oz|lb|lbs|g|kg|ml|l|pinch|clove|cloves|can|cans|slice|slices)?)\s+(.+)$/i);
  return (m ? m[2] : line).trim();
}

function getFormatPreview(w) {
  // Image-bearing formats: comic/visual-novel/pdf/other use the batched _thumb;
  // recipe uses its own hero image stored in content.
  if (w._thumb?.file_url && w._thumb.file_type !== "pdf") {
    return { image: w._thumb.file_url, text: null };
  }

  if (!w.content) return null;
  try {
    const parsed = JSON.parse(w.content);
    if (w.format === "recipe" && parsed.recipe) {
      const r = parsed.recipe;
      const ingredients = r.ingredients || [];
      const ingCount = ingredients.length;
      const stepCount = (r.steps || []).length;
      const bits = [];
      if (ingCount) bits.push(`${ingCount} ingredient${ingCount !== 1 ? "s" : ""}`);
      if (stepCount) bits.push(`${stepCount} step${stepCount !== 1 ? "s" : ""}`);
      if (r.baseServings) bits.push(`serves ${r.baseServings}`);
      const dietTags = DIET_TAGS
        .filter(d => ingCount > 0 && ingredients.every(ing => !(ing.excludes || []).includes(d.id)))
        .map(d => d.label);
      const ingredientTags = ingredients.map(ingredientNameOf).filter(Boolean);
      return { text: bits.join(" · ") || null, image: r.heroImage || null, dietTags, ingredientTags };
    }
    if (w.format === "prose" && parsed.chapters) {
      const chCount = parsed.chapters.length;
      const firstText = (parsed.chapters[0]?.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const snippet = firstText.length > 140 ? firstText.slice(0, 140) + "…" : firstText;
      const bits = [];
      if (chCount) bits.push(`${chCount} chapter${chCount !== 1 ? "s" : ""}`);
      return { text: snippet || null, meta: bits.join(""), image: null };
    }
  } catch {}
  return null;
}

export default function Browse() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [andTags, setAnd] = useState([]); const [orTags, setOr] = useState([]); const [excludeTags, setEx] = useState([]);
  const [allResults, setAll] = useState([]); const [sort, setSort] = useState("recent");
  const [loading, setLoading] = useState(false); const [searched, setSearched] = useState(false);
  const [error, setError] = useState(""); const [myReacts, setMyReacts] = useState({}); const [reactCounts, setRC] = useState({});
  const [commentCounts, setCC] = useState({});
  const [selectedFormats, setFormats] = useState([]); // [] means "all formats"
  const [generalQuery, setGeneralQuery] = useState("");

  const addTo = (s) => (t) => s(p => p.includes(t) ? p : [...p, t]);
  const rmFrom = (s) => (t) => s(p => p.filter(x => x !== t));

  const toggleFormat = (id) => {
    setFormats(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

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
  const clearAll = () => { setAnd([]); setOr([]); setEx([]); setFormats([]); setGeneralQuery(""); runSearch([], [], []); };

  const handleReact = async (e, workId, reaction) => {
    e.stopPropagation(); if (!session) return;
    const cur = myReacts[workId]; const next = cur === reaction ? null : reaction;
    setMyReacts(p => ({ ...p, [workId]: next }));
    setRC(p => { const c = { ...(p[workId] || { likes: 0, dislikes: 0 }) }; if (cur === "like") c.likes = Math.max(0, c.likes - 1); if (cur === "dislike") c.dislikes = Math.max(0, c.dislikes - 1); if (next === "like") c.likes += 1; if (next === "dislike") c.dislikes += 1; return { ...p, [workId]: c }; });
    await Reactions.react(session.access_token, session.user.id, workId, next);
  };

  // Apply format filter and general query client-side
  const sorted = applySort(allResults, sort, commentCounts);
  const results = sorted
    .filter(w => selectedFormats.length === 0 || selectedFormats.includes(w.format))
    .filter(w => fuzzyMatch(w, generalQuery));

  return (
    <div className="browse-wrap">
      <div style={{ padding: "32px 0 24px", borderBottom: "var(--border)", marginBottom: 28 }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 38, letterSpacing: "0.5px" }}>Browse Works</div>
        <div style={{ fontSize: 13, color: "var(--gray-400)", marginTop: 4 }}>All public works in the archive. Filter by tags, format, or search to find what you want.</div>
      </div>

      {/* General search */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ position: "relative" }}>
          <input
            className="input"
            type="text"
            placeholder='General search — try "macaroni and cheese" or "dnd adventure"…'
            value={generalQuery}
            onChange={e => setGeneralQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doSearch()}
            style={{ paddingRight: 40, borderRadius: 8, borderWidth: 2 }}
          />
          {generalQuery && (
            <button
              onClick={() => setGeneralQuery("")}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--gray-400)", lineHeight: 1 }}
            >×</button>
          )}
        </div>
      </div>

      {/* Format multi-select */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gray-600)", marginBottom: 8 }}>Format</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {FORMAT_OPTIONS.map(f => (
            <button
              key={f.id}
              onClick={() => toggleFormat(f.id)}
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                padding: "7px 16px",
                border: "2px solid #111",
                borderRadius: 20,
                cursor: "pointer",
                transition: "all 0.1s",
                background: selectedFormats.includes(f.id) ? "#111" : "#fff",
                color: selectedFormats.includes(f.id) ? "#fff" : "#111",
                transform: selectedFormats.includes(f.id) ? "translate(-1px,-1px)" : "none",
                boxShadow: selectedFormats.includes(f.id) ? "2px 2px 0 var(--red)" : "none",
              }}
            >
              {f.label}
            </button>
          ))}
          {selectedFormats.length > 0 && (
            <button onClick={() => setFormats([])} style={{ fontSize: 11, fontWeight: 700, color: "var(--red)", background: "none", border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Clear ×
            </button>
          )}
        </div>
      </div>

      {/* Tag filter */}
      <div className="search-builder">
        <div className="search-builder-header">
          <span className="search-builder-title">★ Tag Filter ★</span>
          <button className="text-link" style={{ fontSize: 11 }} onClick={clearAll}>Clear all</button>
        </div>
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

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {results.map(w => {
              const counts = reactCounts[w.id] || { likes: 0, dislikes: 0 }; const myR = myReacts[w.id];
              const preview = getFormatPreview(w);
              return (
                <div
                  key={w.id}
                  onClick={() => navigate(`/works/${w.id}`)}
                  style={{
                    border: "var(--border-thin)", borderRadius: "var(--radius)", overflow: "hidden",
                    cursor: "pointer", background: "#fff", display: "flex",
                    transition: "transform 0.1s, box-shadow 0.1s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translate(-3px,-3px)"; e.currentTarget.style.boxShadow = "4px 4px 0 var(--black)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  {/* Preview block — image if available, otherwise a format-icon placeholder or text snippet */}
                  <div style={{ position: "relative", width: 200, flexShrink: 0, background: preview?.image ? "transparent" : "var(--gray-100)", borderRight: "var(--border-thin)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {preview?.image ? (
                      <img src={preview.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : preview?.text ? (
                      <div style={{ padding: "14px", fontSize: 11.5, color: "var(--gray-600)", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 7, WebkitBoxOrient: "vertical" }}>
                        {preview.text}
                      </div>
                    ) : (
                      <span style={{ fontSize: 40, opacity: 0.5 }}>{FORMAT_ICON[w.format] || "📁"}</span>
                    )}
                    <span className="format-badge" style={{ position: "absolute", top: 8, left: 8 }}>{w.format}</span>
                  </div>

                  {/* Content block */}
                  <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-serif)", fontSize: 19, letterSpacing: "0.2px", lineHeight: 1.2, marginBottom: 6 }}>{w.title}</div>
                    {w.description && (
                      <div style={{ fontSize: 12, color: "var(--gray-600)", lineHeight: 1.5, marginBottom: 8, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {w.description}
                      </div>
                    )}
                    {preview?.meta && (
                      <div style={{ fontSize: 10.5, color: "var(--gray-400)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
                        {preview.meta}
                      </div>
                    )}
                    {(w.tags?.length > 0 || preview?.dietTags?.length > 0 || preview?.ingredientTags?.length > 0) && (
                      <div style={{ marginBottom: 8, display: "flex", flexDirection: "column", gap: 3 }}>
                        {w.tags?.length > 0 && (
                          <div style={{ display: "flex", gap: 4, overflowX: "auto", flexWrap: "nowrap" }} onClick={e => e.stopPropagation()}>
                            {w.tags.map(t => <span className="tag-chip" key={t} style={{ fontSize: 10.5, whiteSpace: "nowrap", flexShrink: 0 }}>{t}</span>)}
                          </div>
                        )}
                        {preview?.dietTags?.length > 0 && (
                          <div style={{ display: "flex", gap: 4, overflowX: "auto", flexWrap: "nowrap" }} onClick={e => e.stopPropagation()}>
                            {preview.dietTags.map(t => <span className="tag-chip" key={t} style={{ fontSize: 10.5, whiteSpace: "nowrap", flexShrink: 0, background: "#eaf3de", borderColor: "#639922", color: "#3b6d11" }}>{t}</span>)}
                          </div>
                        )}
                        {preview?.ingredientTags?.length > 0 && (
                          <div style={{ display: "flex", gap: 4, overflowX: "auto", flexWrap: "nowrap" }} onClick={e => e.stopPropagation()}>
                            {preview.ingredientTags.map(t => <span className="tag-chip" key={t} style={{ fontSize: 10, whiteSpace: "nowrap", flexShrink: 0, background: "var(--gray-100)", color: "var(--gray-600)" }}>{t}</span>)}
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                      <button className={`reaction-btn ${myR === "like" ? "active-like" : ""}`} onClick={e => handleReact(e, w.id, "like")} disabled={!session} title={session ? "Like" : "Sign in"} style={{ padding: "4px 9px", fontSize: 11 }}>👍 {counts.likes}</button>
                      <button className={`reaction-btn ${myR === "dislike" ? "active-dislike" : ""}`} onClick={e => handleReact(e, w.id, "dislike")} disabled={!session} title={session ? "Dislike" : "Sign in"} style={{ padding: "4px 9px", fontSize: 11 }}>👎 {counts.dislikes}</button>
                      <span style={{ fontSize: 11, color: "var(--gray-400)", marginLeft: "auto" }}>💬 {commentCounts[w.id] || 0}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}