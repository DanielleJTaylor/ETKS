import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { Works, Reactions, Profiles } from "../lib/api";
import ProseEditor, { ProseViewer } from "../components/editors/ProseEditor";
import { ComicSection, PDFSection, ImageGallery } from "../components/editors/FormatEditors";
import { RecipeSection, DIET_TAGS, nameOf } from "../components/editors/RecipeEditor";
import CommentsSection from "../components/CommentsSection";
import TagInput from "../components/TagInput";

export default function WorkDetail() {
  const { id }       = useParams();
  const { session }  = useAuth();
  const navigate     = useNavigate();
  const location     = useLocation();

  const [work, setWork]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [myReact, setMyReact]       = useState(null);
  const [counts, setCounts]         = useState({ likes: 0, dislikes: 0 });
  const [error, setError]           = useState("");
  const [authorName, setAuthorName] = useState(null);
  const [editMode, setEditMode]     = useState(false);
  const [workKey, setWorkKey]       = useState(0);
  const [tags, setTags]             = useState([]);
  const [tagSaving, setTagSaving]   = useState(false);

  // canEdit is true whenever the signed-in user owns this work — regardless
  // of which page they navigated from (Browse, Dashboard, a direct link, etc.)
  const canEdit = !!(session && work && session.user?.id === work.user_id);

  // For recipes, derive the diet badges and ingredient-name tags from the
  // saved content so they can render in the header alongside manual tags.
  const recipeAutoTags = (() => {
    if (!work || work.format !== "recipe" || !work.content) return { diet: [], ingredients: [] };
    try {
      const parsed = JSON.parse(work.content);
      const ingredients = parsed.recipe?.ingredients || [];
      if (ingredients.length === 0) return { diet: [], ingredients: [] };
      const diet = DIET_TAGS
        .filter(d => ingredients.every(ing => !(ing.excludes || []).includes(d.id)))
        .map(d => d.label);
      const ingredientNames = [...new Set(ingredients.map(ing => nameOf(ing)).filter(Boolean))];
      return { diet, ingredients: ingredientNames };
    } catch {
      return { diet: [], ingredients: [] };
    }
  })();

  useEffect(() => {
    Works.fetchOne(id, session?.access_token).then(({ data, error: err }) => {
      if (err || !data) { setError("Work not found or not accessible."); setLoading(false); return; }
      setWork(data);
      setTags(data.tags || []);
      setCounts({ likes: data.like_count || 0, dislikes: data.dislike_count || 0 });
      document.title = `${data.title} — E&TKS`;
      Profiles.fetchByIds([data.user_id]).then(names => setAuthorName(names[data.user_id] || null));
      setLoading(false);
    });
  }, [id, session]);

  const saveTags = async (nextTags) => {
    setTags(nextTags);
    if (!session?.access_token || !work) return;
    setTagSaving(true);
    await Works.update(session.access_token, work.id, { tags: nextTags });
    setTagSaving(false);
  };

  const addTag = (tag) => {
    if (tags.includes(tag)) return;
    if (tags.length >= 20) return;
    saveTags([...tags, tag]);
  };

  const removeTag = (tag) => {
    saveTags(tags.filter(t => t !== tag));
  };

  useEffect(() => {
    if (!work || !session?.access_token) return;
    Reactions.fetchMine(session.access_token, [work.id]).then(m => setMyReact(m[work.id] || null));
  }, [work, session]);

  const handleReact = async (reaction) => {
    if (!session) return;
    const next = myReact === reaction ? null : reaction;
    setMyReact(next);
    setCounts(c => {
      const n = { ...c };
      if (myReact === "like")    n.likes    = Math.max(0, n.likes - 1);
      if (myReact === "dislike") n.dislikes = Math.max(0, n.dislikes - 1);
      if (next === "like")       n.likes    += 1;
      if (next === "dislike")    n.dislikes += 1;
      return n;
    });
    await Reactions.react(session.access_token, session.user.id, work.id, next);
  };

  const exitEdit = async () => {
    const { data } = await Works.fetchOne(id, session?.access_token);
    if (data) setWork(data);
    setWorkKey(k => k + 1);
    setEditMode(false);
  };

  if (loading) return (
    <div className="page-loading">
      <span className="spinner" style={{ borderColor: "var(--gray-400)", borderTopColor: "transparent" }} />
      Loading work…
    </div>
  );

  if (error || !work) return (
    <div style={{ textAlign: "center", padding: "80px 24px" }}>
      <p style={{ color: "var(--gray-600)", marginBottom: 16 }}>{error || "Work not found."}</p>
      <button className="btn" onClick={() => navigate(-1)}>← Go Back</button>
    </div>
  );

  const isOwner  = session?.user?.id === work.user_id;
  const isPublic = work.visibility === "public";

  if (!isPublic && !isOwner) return (
    <div style={{ textAlign: "center", padding: "80px 24px" }}>
      <p style={{ color: "var(--gray-600)", marginBottom: 16 }}>This work is private.</p>
      <button className="btn" onClick={() => navigate(-1)}>← Go Back</button>
    </div>
  );

  // Prose full-screen edit mode — only if canEdit (came from My Works)
  if (editMode && canEdit && work.format === "prose") {
    return (
      <ProseEditor
        work={work}
        isOwner={true}
        session={session}
        authorName={authorName}
        onExitEdit={exitEdit}
      />
    );
  }

  const parseChapters = () => {
    try {
      const p = JSON.parse(work.content || "{}");
      if (p.chapters) return p.chapters;
    } catch {}
    if (work.content) return [{ id: "ch1", title: "Chapter 1", content: work.content }];
    return [{ id: "ch1", title: "Chapter 1", content: "" }];
  };

  return (
    <div className="work-detail-wrap">
      {/* Header */}
      <div className="work-detail-header">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <div className="work-detail-title">{work.title}</div>
        <div className="work-detail-meta">
          <span className="format-badge">{work.format}</span>
          <span className={`vis-badge ${work.visibility}`}>
            {work.visibility === "private" ? "🔒 Private" : "🌐 Public"}
          </span>
          <span style={{ fontSize: 12, color: "var(--gray-400)", fontFamily: "var(--font-mono)" }}>
            {authorName ? `by ${authorName} · ` : ""}
            {new Date(work.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </span>
          {/* Edit controls — only shown when canEdit (came from My Works) */}
          {canEdit && (
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              {work.format === "prose" && (
                <button className="btn btn-primary btn-sm" onClick={() => setEditMode(true)}>✏️ Edit Mode</button>
              )}
              <Link to={`/works/${work.id}/edit`} className="btn btn-sm">⚙ Settings</Link>
            </div>
          )}
        </div>
        {work.description && <div className="work-detail-desc">{work.description}</div>}
        <div className="work-detail-tags" style={{ marginTop: 8 }}>
          {(tags.length > 0 || canEdit) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 6 }}>
              {tags.map(t => (
                <span className="tag-chip" key={t} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  {t}
                  {canEdit && (
                    <button onClick={() => removeTag(t)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: 12, padding: 0, marginLeft: 2 }}>×</button>
                  )}
                </span>
              ))}
              {canEdit && tags.length < 20 && (
                <div className="inline-tag-input" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <TagInput placeholder="+ Add tag" onAdd={addTag} disabled={tags.length >= 20} />
                  {tagSaving && <span className="spinner" style={{ borderColor: "var(--gray-400)", borderTopColor: "transparent", width: 11, height: 11 }} />}
                </div>
              )}
            </div>
          )}
          {recipeAutoTags.diet.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--gray-400)", marginRight: 2 }}>Diet:</span>
              {recipeAutoTags.diet.map(label => (
                <span key={`diet-${label}`} className="tag-chip" style={{ background: "#eaf3de", borderColor: "#639922", color: "#3b6d11" }}>{label}</span>
              ))}
            </div>
          )}
          {recipeAutoTags.ingredients.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--gray-400)", marginRight: 2 }}>Ingredients:</span>
              {recipeAutoTags.ingredients.map(name => (
                <span key={`ing-${name}`} className="tag-chip" style={{ fontSize: 10.5, background: "var(--gray-100)", color: "var(--gray-600)" }}>{name}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reactions */}
      {(isPublic || isOwner) && (
        <div className="work-detail-reactions">
          <button className={`reaction-btn ${myReact === "like" ? "active-like" : ""}`}
            onClick={() => handleReact("like")} disabled={!session || isOwner}
            title={isOwner ? "Can't react to own work" : session ? "Like" : "Sign in"}>
            👍 {counts.likes} {counts.likes === 1 ? "like" : "likes"}
          </button>
          <button className={`reaction-btn ${myReact === "dislike" ? "active-dislike" : ""}`}
            onClick={() => handleReact("dislike")} disabled={!session || isOwner}
            title={isOwner ? "Can't react to own work" : session ? "Dislike" : "Sign in"}>
            👎 {counts.dislikes} {counts.dislikes === 1 ? "dislike" : "dislikes"}
          </button>
          {!session && <span style={{ fontSize: 12, color: "var(--gray-400)", marginLeft: 4 }}>Sign in to react.</span>}
        </div>
      )}

      {/* Content — viewer always; edit mode buttons only when canEdit */}
      <div>
        {work.format === "prose" && (
          <ProseViewer
            key={workKey}
            chapters={parseChapters()}
            workTitle={work.title}
            authorName={authorName}
          />
        )}
        {work.format === "comic" && (
          <ComicSection key={workKey} work={work} canEdit={canEdit} session={session} />
        )}
        {work.format === "visual-novel" && (
          <ComicSection key={workKey} work={work} canEdit={canEdit} session={session} />
        )}
        {work.format === "pdf" && (
          <PDFSection key={workKey} work={work} canEdit={canEdit} session={session} />
        )}
        {work.format === "recipe" && (
          <RecipeSection key={workKey} work={work} canEdit={canEdit} session={session} onContentChange={content => setWork(w => ({ ...w, content }))} />
        )}
        {work.format === "other" && (
          <ImageGallery key={workKey} work={work} canEdit={canEdit} session={session} />
        )}
      </div>

      <CommentsSection work={work} session={session} />
    </div>
  );
}