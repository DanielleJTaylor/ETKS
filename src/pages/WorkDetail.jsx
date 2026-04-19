import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { Works, Reactions, Profiles } from "../lib/api";
import ProseEditor, { ProseViewer } from "../components/editors/ProseEditor";
import { ComicSection, PDFSection, ImageGallery } from "../components/editors/FormatEditors";
import CommentsSection from "../components/CommentsSection";

export default function WorkDetail() {
  const { id }       = useParams();
  const { session }  = useAuth();
  const navigate     = useNavigate();
  const location     = useLocation();

  // canEdit is ONLY true when navigating from My Works (Dashboard)
  const canEdit = !!(session && location.state?.canEdit);

  const [work, setWork]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [myReact, setMyReact]       = useState(null);
  const [counts, setCounts]         = useState({ likes: 0, dislikes: 0 });
  const [error, setError]           = useState("");
  const [authorName, setAuthorName] = useState(null);
  const [editMode, setEditMode]     = useState(false);
  const [workKey, setWorkKey]       = useState(0);

  useEffect(() => {
    Works.fetchOne(id, session?.access_token).then(({ data, error: err }) => {
      if (err || !data) { setError("Work not found or not accessible."); setLoading(false); return; }
      setWork(data);
      setCounts({ likes: data.like_count || 0, dislikes: data.dislike_count || 0 });
      document.title = `${data.title} — E&TKS`;
      Profiles.fetchByIds([data.user_id]).then(names => setAuthorName(names[data.user_id] || null));
      setLoading(false);
    });
  }, [id, session]);

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

  // Novel full-screen edit mode — only if canEdit (came from My Works)
  if (editMode && canEdit && work.format === "novel") {
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
              {work.format === "novel" && (
                <button className="btn btn-primary btn-sm" onClick={() => setEditMode(true)}>✏️ Edit Mode</button>
              )}
              <Link to={`/works/${work.id}/edit`} className="btn btn-sm">⚙ Settings</Link>
            </div>
          )}
        </div>
        {work.description && <div className="work-detail-desc">{work.description}</div>}
        {(work.tags || []).length > 0 && (
          <div className="work-detail-tags">
            {(work.tags || []).map(t => <span className="tag-chip" key={t}>{t}</span>)}
          </div>
        )}
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
        {work.format === "novel" && (
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
        {work.format === "pdf" && (
          <PDFSection key={workKey} work={work} canEdit={canEdit} session={session} />
        )}
        {work.format === "other" && (
          <ImageGallery key={workKey} work={work} canEdit={canEdit} session={session} />
        )}
      </div>

      <CommentsSection work={work} session={session} />
    </div>
  );
}