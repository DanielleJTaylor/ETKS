import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { SUPABASE_URL, Profiles, apiFetch, dbH, anonDbH } from "../lib/api";

async function fetchUserWorks(userId, token) {
  const pubRes = await apiFetch(
    `${SUPABASE_URL}/rest/v1/works?user_id=eq.${userId}&visibility=eq.public&order=created_at.desc&select=*`,
    { headers: anonDbH() }
  );
  const pub = pubRes.ok ? await pubRes.json() : [];
  if (token) {
    const privRes = await apiFetch(
      `${SUPABASE_URL}/rest/v1/works?user_id=eq.${userId}&visibility=eq.private&order=created_at.desc&select=*`,
      { headers: dbH(token) }
    );
    const priv = privRes.ok ? await privRes.json() : [];
    return [...pub, ...priv].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  return pub;
}

export default function Profile() {
  const { username } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile]         = useState(null);
  const [works, setWorks]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [isOwn, setIsOwn]             = useState(false);
  const [editing, setEditing]         = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newBio, setNewBio]           = useState("");
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState("");
  const [saved, setSaved]             = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true); setError("");
      const { data: prof, error: pErr } = await Profiles.fetchByUsername(username);
      if (pErr || !prof) { setError("User not found."); setLoading(false); return; }
      setProfile(prof);
      const own = session?.user?.id === prof.id;
      setIsOwn(own);
      const ws = await fetchUserWorks(prof.id, own ? session?.access_token : null);
      setWorks(ws);
      setLoading(false);
    }
    load();
  }, [username, session]);

  const startEdit = () => { setNewUsername(profile.username||""); setNewBio(profile.bio||""); setEditing(true); setSaveError(""); };

  const saveProfile = async () => {
    setSaveError("");
    const uname = newUsername.trim().toLowerCase();
    if (!uname) return setSaveError("Username required.");
    if (!/^[a-z0-9_-]{3,30}$/.test(uname)) return setSaveError("3–30 chars, letters/numbers/_ only.");
    setSaving(true);
    const { data, error: err } = await Profiles.update(session.access_token, profile.id, { username: uname, bio: newBio.trim()||null });
    setSaving(false);
    if (err) return setSaveError(err.includes("duplicate") ? "Username already taken." : err);
    const updated = { ...profile, username: data?.username||uname, bio: data?.bio||newBio.trim()||null };
    setProfile(updated); setEditing(false); setSaved(true); setTimeout(()=>setSaved(false), 2500);
    if (updated.username !== username) navigate(`/u/${updated.username}`, { replace: true });
  };

  if (loading) return <div className="page-loading"><span className="spinner" style={{borderColor:"var(--gray-400)",borderTopColor:"transparent"}}/>Loading…</div>;
  if (error)   return <div style={{textAlign:"center",padding:"80px 24px"}}><p style={{color:"var(--gray-600)",marginBottom:16}}>{error}</p><Link to="/browse" className="btn">Browse Works</Link></div>;

  const pubCount  = works.filter(w=>w.visibility==="public").length;
  const privCount = works.filter(w=>w.visibility==="private").length;

  return (
    <div className="page-wrap">
      <div style={{padding:"36px 0 28px",borderBottom:"var(--border)",marginBottom:28}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}>
          <div>
            <div style={{fontFamily:"var(--font-serif)",fontSize:34,fontWeight:900,marginBottom:6}}>
              {profile.username||<span style={{color:"var(--gray-400)"}}>unnamed</span>}
            </div>
            {profile.bio && <div style={{fontSize:14,color:"var(--gray-600)",lineHeight:1.65,maxWidth:520,marginBottom:10}}>{profile.bio}</div>}
            <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
              <span style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--gray-400)"}}>{pubCount} public work{pubCount!==1?"s":""}</span>
              {isOwn&&privCount>0&&<span style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--gray-400)"}}>{privCount} private</span>}
              <span style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--gray-400)"}}>Joined {new Date(profile.created_at).toLocaleDateString("en-US",{month:"long",year:"numeric"})}</span>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            {isOwn&&!editing&&<button className="btn btn-sm" onClick={startEdit}>✏️ Edit Profile</button>}
            {isOwn&&<Link to="/dashboard" className="btn btn-sm">Dashboard</Link>}
          </div>
        </div>

        {editing&&(
          <div style={{marginTop:20,padding:20,border:"var(--border)",background:"var(--white)"}}>
            <div className="section-mono" style={{marginBottom:16}}>Edit Profile</div>
            {saved&&<div className="success-banner">✓ Saved.</div>}
            <div className="field">
              <label className="label">Username</label>
              <input className="input" type="text" placeholder="yourname" value={newUsername} onChange={e=>setNewUsername(e.target.value)}/>
              <div style={{fontSize:11,color:"var(--gray-400)",marginTop:4}}>3–30 characters. Letters, numbers, hyphens, underscores.</div>
            </div>
            <div className="field" style={{marginBottom:0}}>
              <label className="label">Bio</label>
              <textarea className="input" placeholder="Tell the archive about yourself…" value={newBio} onChange={e=>setNewBio(e.target.value)} style={{minHeight:70}}/>
            </div>
            {saveError&&<div className="error-msg">{saveError}</div>}
            <div style={{display:"flex",gap:8,marginTop:14}}>
              <button className="btn btn-primary btn-sm" onClick={saveProfile} disabled={saving}>{saving?<><span className="spinner"/>Saving…</>:"Save Profile"}</button>
              <button className="btn btn-sm" onClick={()=>setEditing(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      <div style={{marginBottom:16,fontFamily:"var(--font-mono)",fontSize:10,fontWeight:500,letterSpacing:"0.15em",textTransform:"uppercase",color:"var(--gray-400)"}}>
        {isOwn?"All Works":"Public Works"}
      </div>

      {works.length===0&&(
        <div style={{textAlign:"center",padding:"48px 0"}}>
          <div style={{fontSize:28,marginBottom:12}}>📂</div>
          <div style={{fontFamily:"var(--font-serif)",fontSize:18,fontWeight:700,marginBottom:8}}>{isOwn?"Your archive is empty":"No public works yet"}</div>
          {isOwn&&<Link to="/create" className="btn btn-primary">Create First Work</Link>}
        </div>
      )}

      {works.map(w=>(
        <div className="browse-card" key={w.id} onClick={()=>navigate(`/works/${w.id}`)}>
          <div className="browse-card-top">
            <div className="browse-card-title">{w.title}</div>
            <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
              <span className="format-badge">{w.format}</span>
              {isOwn&&<span className={`vis-badge ${w.visibility}`}>{w.visibility==="private"?"🔒":"🌐"}</span>}
            </div>
          </div>
          {w.description&&<div className="browse-card-desc">{w.description}</div>}
          {(w.tags||[]).length>0&&<div className="browse-tags" style={{marginTop:8}}>{(w.tags||[]).slice(0,6).map(t=><span className="tag-chip" key={t}>{t}</span>)}{(w.tags||[]).length>6&&<span className="tag-chip">+{w.tags.length-6}</span>}</div>}
          <div style={{marginTop:8,fontSize:11,color:"var(--gray-400)",fontFamily:"var(--font-mono)"}}>{new Date(w.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
        </div>
      ))}
    </div>
  );
}
