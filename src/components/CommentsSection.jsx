import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Comments, Profiles } from "../lib/api";

export default function CommentsSection({ work, session }) {
  const [comments, setComments]   = useState([]);
  const [usernames, setUsernames] = useState({});
  const [loading, setLoading]     = useState(true);
  const [newComment, setNew]       = useState("");
  const [posting, setPosting]     = useState(false);
  const [error, setError]         = useState("");

  useEffect(() => {
    Comments.fetch(work.id).then(async ({ data }) => {
      setComments(data || []);
      if (data && data.length > 0) {
        const ids = [...new Set(data.map(c => c.user_id).filter(Boolean))];
        const names = await Profiles.fetchByIds(ids);
        setUsernames(names);
      }
      setLoading(false);
    });
  }, [work.id]);

  const post = async () => {
    if (!newComment.trim() || !session) return;
    setPosting(true); setError("");
    const { data, error: err } = await Comments.add(session.access_token, work.id, session.user.id, newComment.trim());
    setPosting(false);
    if (err) { setError(err); return; }
    setComments(prev => [...prev, data]);
    setNew("");
    // Fetch own username if not cached
    if (!usernames[session.user.id]) {
      const names = await Profiles.fetchByIds([session.user.id]);
      setUsernames(prev => ({ ...prev, ...names }));
    }
  };

  const del = async (id) => {
    await Comments.delete(session.access_token, id);
    setComments(prev => prev.filter(c => c.id !== id));
  };

  const fmt = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const displayName = (userId) => {
    const uname = usernames[userId];
    if (uname) return { label: uname, href: `/u/${uname}` };
    return { label: userId?.slice(0, 8) + "…", href: null };
  };

  return (
    <div className="comments-section">
      <div className="comments-title">Comments ({comments.length})</div>
      {loading && <div style={{ fontSize: 13, color: "var(--gray-400)" }}>Loading…</div>}

      {comments.map(c => {
        const { label, href } = displayName(c.user_id);
        return (
          <div className="comment-item" key={c.id}>
            <div className="comment-header">
              {href
                ? <Link to={href} className="comment-author" style={{ textDecoration:"none", color:"var(--black)" }} onClick={e => e.stopPropagation()}>{label}</Link>
                : <span className="comment-author">{label}</span>
              }
              <span className="comment-date">{fmt(c.created_at)}</span>
              {session?.user?.id === c.user_id && (
                <button className="comment-delete" onClick={() => del(c.id)}>Delete</button>
              )}
            </div>
            <div className="comment-body">{c.content}</div>
          </div>
        );
      })}

      {comments.length === 0 && !loading && (
        <div style={{ fontSize: 13, color: "var(--gray-400)", marginBottom: 16 }}>No comments yet. Be the first!</div>
      )}

      {error && <div className="error-msg">{error}</div>}

      {session ? (
        <div className="comment-form">
          <textarea className="input" placeholder="Write a comment… (Ctrl+Enter to post)"
            value={newComment} onChange={e => setNew(e.target.value)} style={{ minHeight: 80 }}
            onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) post(); }} />
          <div>
            <button className="btn btn-primary" onClick={post} disabled={posting || !newComment.trim()}>
              {posting ? <><span className="spinner" /> Posting…</> : "Post Comment"}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 13, color: "var(--gray-400)", marginTop: 12 }}>Sign in to leave a comment.</div>
      )}
    </div>
  );
}
