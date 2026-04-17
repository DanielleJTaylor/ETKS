import { useState, useEffect, useRef, useCallback } from "react";
import { Works, uploadToStorage } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function parseContent(raw) {
  if (!raw) return [{ id: "ch1", title: "Chapter 1", content: "" }];
  try {
    const p = JSON.parse(raw);
    if (p.chapters && Array.isArray(p.chapters)) return p.chapters;
  } catch {}
  return [{ id: "ch1", title: "Chapter 1", content: raw }];
}
function countWords(html) {
  const t = (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return t ? t.split(" ").length : 0;
}
function isInList(editorEl) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  let el = sel.getRangeAt(0).startContainer;
  if (el.nodeType === 3) el = el.parentElement;
  while (el && el !== editorEl) {
    if (el.tagName === "LI") return true;
    el = el.parentElement;
  }
  return false;
}

// ─── SHARED SELECT STYLE ──────────────────────────────────────────────────────
const SS = { fontFamily: "inherit", fontSize: 12, padding: "3px 6px", border: "1px solid #ddd", background: "#fff", cursor: "pointer", outline: "none", height: 26, borderRadius: 3 };
const Sep = () => <div style={{ width: 1, height: 20, background: "#e0e0e0", margin: "0 4px", flexShrink: 0 }} />;

function ToolBtn({ onClick, onMouseDown, children, title, style = {} }) {
  const [hover, setHover] = useState(false);
  return (
    <button title={title} onClick={onClick} onMouseDown={onMouseDown}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ padding: "3px 8px", border: "none", background: hover ? "#e8e8e8" : "transparent", cursor: "pointer", fontSize: 13, borderRadius: 3, lineHeight: 1.4, color: "#333", flexShrink: 0, ...style }}>
      {children}
    </button>
  );
}

// ─── TOOLBAR ─────────────────────────────────────────────────────────────────
function Toolbar({ exec, execDirect, fontFamily, setFontFamily, onInsertImage }) {
  const fonts = ["Lora", "Georgia", "Palatino Linotype", "Times New Roman", "Garamond", "Arial", "Helvetica"];
  const textColorRef = useRef(null);
  const hlColorRef   = useRef(null);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "5px 14px", background: "#fff", borderBottom: "1px solid #e5e5e5", flexWrap: "wrap" }}>

      {/* Undo / Redo */}
      <ToolBtn onMouseDown={e=>{e.preventDefault();exec("undo")}} title="Undo">↩</ToolBtn>
      <ToolBtn onMouseDown={e=>{e.preventDefault();exec("redo")}} title="Redo">↪</ToolBtn>
      <Sep />

      {/* Block style */}
      <select style={SS} defaultValue="" onChange={e => { exec("formatBlock", e.target.value); e.target.value = ""; }}>
        <option value="" disabled>Style</option>
        <option value="p">Normal</option>
        <option value="h1">Title</option>
        <option value="h2">Heading 1</option>
        <option value="h3">Heading 2</option>
        <option value="h4">Heading 3</option>
        <option value="blockquote">Quote</option>
        <option value="pre">Code</option>
      </select>

      {/* Font */}
      <select style={{ ...SS, width: 120 }} value={fontFamily} onChange={e => { setFontFamily(e.target.value); exec("fontName", e.target.value); }}>
        {fonts.map(f => <option key={f} value={f}>{f}</option>)}
      </select>

      {/* Size */}
      <select style={{ ...SS, width: 58 }} defaultValue="" onChange={e => { exec("fontSize", e.target.value); e.target.value = ""; }}>
        <option value="" disabled>Size</option>
        <option value="1">8</option><option value="2">10</option><option value="3">12</option>
        <option value="4">14</option><option value="5">18</option><option value="6">24</option><option value="7">36</option>
      </select>
      <Sep />

      {/* Bold / Italic / Underline / Strike */}
      <ToolBtn onMouseDown={e=>{e.preventDefault();exec("bold")}}          title="Bold"          style={{fontWeight:700}}>B</ToolBtn>
      <ToolBtn onMouseDown={e=>{e.preventDefault();exec("italic")}}        title="Italic"        style={{fontStyle:"italic"}}>I</ToolBtn>
      <ToolBtn onMouseDown={e=>{e.preventDefault();exec("underline")}}     title="Underline"     style={{textDecoration:"underline"}}>U</ToolBtn>
      <ToolBtn onMouseDown={e=>{e.preventDefault();exec("strikeThrough")}} title="Strikethrough" style={{textDecoration:"line-through"}}>S</ToolBtn>
      <Sep />

      {/* Alignment dropdown */}
      <select style={SS} defaultValue="" onChange={e => { exec("justify" + e.target.value); e.target.value = ""; }}>
        <option value="" disabled>Align</option>
        <option value="Left">⬅ Left</option>
        <option value="Center">☰ Center</option>
        <option value="Right">➡ Right</option>
        <option value="Full">▤ Justify</option>
      </select>
      <Sep />

      {/* Lists */}
      <ToolBtn onMouseDown={e=>{e.preventDefault();exec("insertUnorderedList")}} title="Bullet list">• List</ToolBtn>
      <ToolBtn onMouseDown={e=>{e.preventDefault();exec("insertOrderedList")}}   title="Numbered list">1. List</ToolBtn>
      <Sep />

      {/* Link */}
      <ToolBtn onMouseDown={e=>{e.preventDefault();const url=prompt("URL:");if(url)exec("createLink",url)}} title="Insert link">🔗</ToolBtn>
      <ToolBtn onMouseDown={e=>{e.preventDefault();exec("unlink")}} title="Remove link">🔗✕</ToolBtn>

      {/* Divider */}
      <ToolBtn onMouseDown={e=>{e.preventDefault();exec("insertHorizontalRule")}} title="Horizontal rule">—</ToolBtn>

      {/* Insert image */}
      <ToolBtn onClick={onInsertImage} title="Insert image">🖼</ToolBtn>
      <Sep />

      {/* Text color picker */}
      <div title="Text color" style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
        <input ref={textColorRef} type="color" defaultValue="#0a0a0a"
          onChange={e => exec("foreColor", e.target.value)}
          style={{ width: 0, height: 0, opacity: 0, position: "absolute", pointerEvents: "none" }} />
        <button onMouseDown={e => { e.preventDefault(); textColorRef.current?.click(); }}
          title="Text color"
          style={{ padding: "3px 8px", border: "none", background: "transparent", cursor: "pointer", fontSize: 13, borderRadius: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 1, color: "#333" }}>
          A
          <div style={{ width: 14, height: 3, background: textColorRef.current?.value || "#0a0a0a", borderRadius: 1 }} />
        </button>
      </div>

      {/* Highlight color picker */}
      <div title="Highlight color" style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
        <input ref={hlColorRef} type="color" defaultValue="#ffff00"
          onChange={e => exec("hiliteColor", e.target.value)}
          style={{ width: 0, height: 0, opacity: 0, position: "absolute", pointerEvents: "none" }} />
        <button onMouseDown={e => { e.preventDefault(); hlColorRef.current?.click(); }}
          title="Highlight color"
          style={{ padding: "3px 8px", border: "none", background: "transparent", cursor: "pointer", fontSize: 13, borderRadius: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 1, color: "#333" }}>
          A
          <div style={{ width: 14, height: 3, background: hlColorRef.current?.value || "#ffff00", borderRadius: 1, border: "1px solid #ccc" }} />
        </button>
      </div>
      <Sep />

      {/* Clear formatting */}
      <ToolBtn onMouseDown={e=>{e.preventDefault();exec("removeFormat")}} title="Clear formatting" style={{fontSize:10}}>✕ fmt</ToolBtn>
    </div>
  );
}

// ─── CHAPTER MANAGER MODAL ────────────────────────────────────────────────────
function ChapterManager({ chapters, activeIdx, onClose, onReorder, onRename, onDelete, onSwitch }) {
  const [local, setLocal]       = useState(chapters.map(c => ({ ...c })));
  const [editId, setEditId]     = useState(null);
  const [editTitle, setEditTitle] = useState("");

  const swap = (i, j) => setLocal(p => { const n=[...p]; [n[i],n[j]]=[n[j],n[i]]; return n; });
  const startRename = c => { setEditId(c.id); setEditTitle(c.title); };
  const commitRename = () => { setLocal(p => p.map(c => c.id===editId ? {...c,title:editTitle} : c)); setEditId(null); };

  const apply = () => {
    onReorder(local);
    local.forEach(c => { const orig=chapters.find(x=>x.id===c.id); if(orig&&orig.title!==c.title) onRename(c.id,c.title); });
    onClose();
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#fff",width:500,maxHeight:"80vh",display:"flex",flexDirection:"column",borderRadius:4,overflow:"hidden",boxShadow:"0 8px 32px rgba(0,0,0,0.2)"}}>
        <div style={{padding:"16px 20px",borderBottom:"1px solid #eee",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontFamily:"Georgia,serif",fontSize:18,fontWeight:700}}>Manage Chapters</span>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#999"}}>×</button>
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          {local.map((c,i) => (
            <div key={c.id} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 16px",borderBottom:"1px solid #f5f5f5",background:chapters[activeIdx]?.id===c.id?"#f9f6f2":"#fff"}}>
              <div style={{display:"flex",flexDirection:"column",gap:2}}>
                <button onClick={()=>swap(i,i-1)} disabled={i===0} style={{border:"1px solid #ddd",background:"none",cursor:i===0?"default":"pointer",padding:"1px 6px",fontSize:10,borderRadius:2,opacity:i===0?0.3:1}}>▲</button>
                <button onClick={()=>swap(i,i+1)} disabled={i===local.length-1} style={{border:"1px solid #ddd",background:"none",cursor:i===local.length-1?"default":"pointer",padding:"1px 6px",fontSize:10,borderRadius:2,opacity:i===local.length-1?0.3:1}}>▼</button>
              </div>
              <div style={{flex:1}}>
                {editId===c.id
                  ? <input autoFocus value={editTitle} onChange={e=>setEditTitle(e.target.value)}
                      onKeyDown={e=>{if(e.key==="Enter")commitRename();if(e.key==="Escape")setEditId(null);}}
                      style={{width:"100%",border:"1px solid #c8001e",borderRadius:3,padding:"4px 8px",fontSize:14,outline:"none"}}/>
                  : <span style={{fontSize:14,color:"#333"}}>{i+1}. {c.title}</span>
                }
              </div>
              <div style={{display:"flex",gap:4,flexShrink:0}}>
                {editId===c.id
                  ? <button onClick={commitRename} style={{fontSize:11,padding:"3px 8px",border:"none",background:"#2e8b57",color:"#fff",cursor:"pointer",borderRadius:2}}>✓</button>
                  : <button onClick={()=>startRename(c)} style={{fontSize:11,padding:"3px 8px",border:"1px solid #ddd",background:"#fff",cursor:"pointer",borderRadius:2}}>Rename</button>
                }
                <button onClick={()=>{onSwitch(chapters.findIndex(x=>x.id===c.id));onClose();}} style={{fontSize:11,padding:"3px 8px",border:"1px solid #ddd",background:"#fff",cursor:"pointer",borderRadius:2}}>Go To</button>
                {local.length>1&&(
                  <button onClick={()=>{if(!confirm(`Delete "${c.title}"?`))return;setLocal(p=>p.filter(x=>x.id!==c.id));onDelete(chapters.findIndex(x=>x.id===c.id));}}
                    style={{fontSize:11,padding:"3px 8px",border:"1px solid #fcc",background:"#fff",color:"#c8001e",cursor:"pointer",borderRadius:2}}>Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div style={{padding:"12px 20px",borderTop:"1px solid #eee",display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{padding:"7px 16px",border:"1px solid #ddd",background:"#fff",cursor:"pointer",borderRadius:3,fontSize:13}}>Cancel</button>
          <button onClick={apply} style={{padding:"7px 16px",border:"none",background:"#0a0a0a",color:"#fff",cursor:"pointer",borderRadius:3,fontSize:13}}>Apply Changes</button>
        </div>
      </div>
    </div>
  );
}

// ─── NESTED LIST CSS ──────────────────────────────────────────────────────────
const ListStyles = () => (
  <style>{`
    .novel-content ul { list-style: none; padding-left: 1.4em; }
    .novel-content ul > li::before { content: "•"; display: inline-block; width: 1em; margin-left: -1em; }
    .novel-content ul ul { padding-left: 1.4em; }
    .novel-content ul ul > li::before { content: "▶"; font-size: 0.7em; vertical-align: middle; display: inline-block; width: 1em; margin-left: -1em; }
    .novel-content ul ul ul { padding-left: 1.4em; }
    .novel-content ul ul ul > li::before { content: "◆"; font-size: 0.7em; vertical-align: middle; display: inline-block; width: 1em; margin-left: -1em; }
    .novel-content ul ul ul ul { padding-left: 1.4em; }
    .novel-content ul ul ul ul > li::before { content: "■"; font-size: 0.7em; vertical-align: middle; display: inline-block; width: 1em; margin-left: -1em; }
    .novel-content ol { list-style: decimal; padding-left: 1.6em; }
    .novel-content ol ol { list-style: lower-alpha; padding-left: 1.6em; }
    .novel-content ol ol ol { list-style: lower-roman; padding-left: 1.6em; }
    .novel-content ol ol ol ol { list-style: upper-alpha; padding-left: 1.6em; }
    .novel-content [contenteditable]:empty::before { content: attr(data-placeholder); color: #bbb; font-style: italic; pointer-events: none; }
  `}</style>
);

// ─── MAIN EDITOR ─────────────────────────────────────────────────────────────
export default function ProseEditor({ work, isOwner, session, authorName, onExitEdit }) {
  const [chapters, setChapters]       = useState(() => parseContent(work.content));
  const [activeIdx, setActiveIdx]     = useState(0);
  const [saveStatus, setSaveStatus]   = useState("");
  const [fontFamily, setFontFamily]   = useState("Lora");
  const [showManager, setShowManager] = useState(false);
  const [previewIdx, setPreviewIdx]   = useState(null);
  const editorRef   = useRef(null);
  const saveTimer   = useRef(null);
  const chaptersRef = useRef(chapters);

  useEffect(() => { chaptersRef.current = chapters; }, [chapters]);

  useEffect(() => {
    const onKey = e => { if (e.key === "Escape") { if (previewIdx !== null) setPreviewIdx(null); else onExitEdit?.(); } };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [previewIdx, onExitEdit]);

  const ch = chapters[activeIdx];

  useEffect(() => {
    if (editorRef.current && previewIdx === null) {
      editorRef.current.innerHTML = ch?.content || "";
    }
  }, [activeIdx, previewIdx]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const saveContent = useCallback((updatedChapters, immediate = false, extraPatch = {}) => {
    if (!isOwner || !session) return;
    clearTimeout(saveTimer.current);
    setSaveStatus("saving");
    const doSave = async () => {
      const content = JSON.stringify({ chapters: updatedChapters || chaptersRef.current });
      const { error } = await Works.update(session.access_token, work.id, { content, ...extraPatch });
      setSaveStatus(error ? "error" : "saved");
      setTimeout(() => setSaveStatus(""), 3000);
    };
    if (immediate) doSave();
    else saveTimer.current = setTimeout(doSave, 1500);
  }, [isOwner, session, work.id]);

  const updateCurrentContent = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const updated = chaptersRef.current.map((c, i) => i === activeIdx ? { ...c, content: html } : c);
    setChapters(updated);
    saveContent(updated);
  };

  const exec = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    setTimeout(updateCurrentContent, 0);
  };

  const captureCurrentContent = () => {
    if (!editorRef.current) return chaptersRef.current;
    const html = editorRef.current.innerHTML;
    return chaptersRef.current.map((c, i) => i === activeIdx ? { ...c, content: html } : c);
  };

  // ── Chapter actions ───────────────────────────────────────────────────────
  const switchChapter = idx => { const u=captureCurrentContent(); setChapters(u); setActiveIdx(idx); setPreviewIdx(null); };
  const addChapter    = () => { const u=captureCurrentContent(); const n={id:`ch${Date.now()}`,title:`Chapter ${u.length+1}`,content:""}; const next=[...u,n]; setChapters(next); setActiveIdx(next.length-1); setPreviewIdx(null); saveContent(next); };
  const deleteChapter = idx => { if(chaptersRef.current.length<=1)return; const u=chaptersRef.current.filter((_,i)=>i!==idx); setChapters(u); setActiveIdx(Math.min(activeIdx,u.length-1)); saveContent(u,true); };
  const reorderChapters = newOrder => { const u=newOrder.map(c=>{const e=chaptersRef.current.find(x=>x.id===c.id);return e?{...e,title:c.title}:c;}); setChapters(u); const na=u.findIndex(c=>c.id===chaptersRef.current[activeIdx]?.id); setActiveIdx(na>=0?na:0); saveContent(u,true); };
  const renameChapter = (id,title) => { const u=chaptersRef.current.map(c=>c.id===id?{...c,title}:c); setChapters(u); saveContent(u); };

  // ── Publish / Draft ───────────────────────────────────────────────────────
  const saveDraft = async () => { const u=captureCurrentContent(); setChapters(u); setSaveStatus("saving"); const {error}=await Works.update(session.access_token,work.id,{content:JSON.stringify({chapters:u}),visibility:"private"}); setSaveStatus(error?"error":"saved"); if(!error)work.visibility="private"; setTimeout(()=>setSaveStatus(""),3000); };
  const publish   = async () => { const u=captureCurrentContent(); setChapters(u); setSaveStatus("saving"); const {error}=await Works.update(session.access_token,work.id,{content:JSON.stringify({chapters:u}),visibility:"public"}); setSaveStatus(error?"error":"saved"); if(!error)work.visibility="public"; setTimeout(()=>setSaveStatus(""),3000); };
  const unpublish = async () => { const {error}=await Works.update(session.access_token,work.id,{visibility:"private"}); if(!error)work.visibility="private"; setSaveStatus("saved"); setTimeout(()=>setSaveStatus(""),2000); };

  // ── Insert image ──────────────────────────────────────────────────────────
  const handleInsertImage = async () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      setSaveStatus("saving");
      const path = `${work.id}/inline/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;
      const { url, error } = await uploadToStorage(session.access_token, "work-files", path, file);
      if (error) { setSaveStatus("error"); return; }
      // Insert centered img
      editorRef.current?.focus();
      document.execCommand("insertHTML", false,
        `<div style="text-align:center;margin:16px 0"><img src="${url}" style="max-width:100%;border-radius:2px" alt=""/></div>`
      );
      setTimeout(updateCurrentContent, 0);
    };
    input.click();
  };

  if (!isOwner) return <ProseViewer chapters={chapters} workTitle={work.title} authorName={authorName} />;

  const words = countWords(ch?.content || "");
  const chars = (ch?.content || "").replace(/<[^>]+>/g,"").length;
  const isPublished = work.visibility === "public";

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, display:"flex", height:"100vh", background:"#f5f5f5" }}>
      <ListStyles />

      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <div style={{ width:220, background:"#2c2c2c", color:"#e0e0e0", display:"flex", flexDirection:"column", flexShrink:0 }}>
        <div style={{ padding:"12px 14px", borderBottom:"1px solid #3a3a3a" }}>
          <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:13, fontWeight:700, color:"#fff", lineHeight:1.3, marginBottom:8 }}>
            {work.title}
          </div>
          {/* Preview = exit editor, see viewer, NO publish */}
          <button onClick={onExitEdit}
            style={{ width:"100%", padding:"6px 10px", background:"#3a3a3a", border:"none", color:"#ccc", cursor:"pointer", fontSize:11, textAlign:"left", borderRadius:3, marginBottom:4 }}
            onMouseEnter={e=>e.currentTarget.style.background="#4a4a4a"}
            onMouseLeave={e=>e.currentTarget.style.background="#3a3a3a"}>
            👁 Preview (View Mode)
          </button>
          <div style={{fontSize:10,color:"#666",lineHeight:1.3,paddingLeft:2}}>Returns to reader view without publishing</div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"6px 0" }}>
          <div style={{ padding:"6px 14px 4px", fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:"#666" }}>Chapters</div>
          {chapters.map((c,i) => (
            <div key={c.id} onClick={()=>switchChapter(i)}
              style={{ padding:"8px 14px", cursor:"pointer", background:i===activeIdx&&previewIdx===null?"#3d3d3d":"transparent", borderLeft:i===activeIdx&&previewIdx===null?"3px solid #c8001e":"3px solid transparent", display:"flex", alignItems:"center", gap:6 }}
              onMouseEnter={e=>{if(i!==activeIdx||previewIdx!==null)e.currentTarget.style.background="#333";}}
              onMouseLeave={e=>{if(i!==activeIdx||previewIdx!==null)e.currentTarget.style.background="transparent";}}>
              <span style={{ fontSize:12, color:i===activeIdx&&previewIdx===null?"#fff":"#bbb", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {i+1}. {c.title}
              </span>
              <button onClick={e=>{e.stopPropagation();switchChapter(i);setPreviewIdx(i);}} title="Preview chapter"
                style={{ background:"none", border:"none", color:"#666", cursor:"pointer", fontSize:11, padding:"1px 4px", flexShrink:0 }}>👁</button>
            </div>
          ))}
        </div>

        <div style={{ borderTop:"1px solid #3a3a3a" }}>
          <button onClick={addChapter}
            style={{ width:"100%", padding:"9px 14px", background:"none", border:"none", color:"#888", cursor:"pointer", textAlign:"left", fontSize:12, fontFamily:"inherit" }}
            onMouseEnter={e=>e.currentTarget.style.color="#ccc"} onMouseLeave={e=>e.currentTarget.style.color="#888"}>
            + Add Chapter
          </button>
          <button onClick={()=>setShowManager(true)}
            style={{ width:"100%", padding:"9px 14px", background:"none", border:"none", borderTop:"1px solid #3a3a3a", color:"#888", cursor:"pointer", textAlign:"left", fontSize:12, fontFamily:"inherit" }}
            onMouseEnter={e=>e.currentTarget.style.color="#ccc"} onMouseLeave={e=>e.currentTarget.style.color="#888"}>
            ⚙ Manage Chapters
          </button>
        </div>
      </div>

      {/* ── MAIN AREA ────────────────────────────────────────────────────── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Toolbar */}
        {previewIdx === null && (
          <Toolbar exec={exec} fontFamily={fontFamily} setFontFamily={setFontFamily} onInsertImage={handleInsertImage} />
        )}

        {/* Preview banner */}
        {previewIdx !== null && (
          <div style={{ padding:"8px 20px", background:"#fff7e6", borderBottom:"1px solid #ffe0a0", display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:13, color:"#886600" }}>👁 Chapter Preview: <strong>{chapters[previewIdx]?.title}</strong> — not published</span>
            <button onClick={()=>setPreviewIdx(null)}
              style={{ marginLeft:"auto", padding:"4px 12px", border:"1px solid #886600", background:"#fff", color:"#886600", cursor:"pointer", borderRadius:3, fontSize:12 }}>
              ✏️ Back to Edit
            </button>
          </div>
        )}

        {/* Chapter title bar */}
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 20px", background:"#fff", borderBottom:"1px solid #eee" }}>
          {previewIdx===null
            ? <input type="text" value={ch?.title||""} onChange={e=>renameChapter(ch.id,e.target.value)} placeholder="Chapter title…"
                style={{ flex:1, border:"none", outline:"none", fontFamily:"'Playfair Display',Georgia,serif", fontSize:16, fontWeight:700, color:"#1a1a1a", background:"transparent" }}/>
            : <span style={{ flex:1, fontFamily:"'Playfair Display',Georgia,serif", fontSize:16, fontWeight:700, color:"#1a1a1a" }}>{chapters[previewIdx]?.title}</span>
          }
          <span style={{ fontFamily:"monospace", fontSize:11, color:"#aaa", flexShrink:0 }}>Ch {activeIdx+1} / {chapters.length}</span>
        </div>

        {/* Canvas */}
        <div style={{ flex:1, overflowY:"auto", background:"#f0eeeb", padding:"32px 24px" }}>
          <div style={{ width:"100%", background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,0.1)", minHeight:"100%" }}>
            {previewIdx !== null ? (
              <div className="novel-content"
                style={{ padding:"40px 72px 60px", fontFamily:`'${fontFamily}',Georgia,serif`, fontSize:16, lineHeight:1.9, color:"#1a1a1a" }}
                dangerouslySetInnerHTML={{ __html: chapters[previewIdx]?.content || "<i style='color:#bbb'>Nothing written yet.</i>" }} />
            ) : (
              <div ref={editorRef} contentEditable suppressContentEditableWarning
                className="novel-content"
                data-placeholder="Start writing here… auto-saves as you type."
                onInput={updateCurrentContent}
                onKeyDown={e => {
                  if (e.key === "Tab") {
                    e.preventDefault();
                    if (isInList(editorRef.current)) {
                      // In a list: indent/outdent sub-list item
                      exec(e.shiftKey ? "outdent" : "indent");
                    } else {
                      // Plain text: insert 4 spaces at cursor only
                      document.execCommand("insertText", false, "\u00a0\u00a0\u00a0\u00a0");
                    }
                  }
                }}
                style={{ padding:"40px 72px 60px", fontFamily:`'${fontFamily}',Georgia,serif`, fontSize:16, lineHeight:1.9, color:"#1a1a1a", outline:"none", minHeight:500, caretColor:"#c8001e" }} />
            )}
          </div>
        </div>

        {/* Status bar */}
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"6px 20px", background:"#fff", borderTop:"1px solid #e5e5e5", flexWrap:"wrap" }}>
          <span style={{ fontFamily:"monospace", fontSize:11, color:"#aaa" }}>{words.toLocaleString()} words · {chars.toLocaleString()} chars</span>
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontFamily:"monospace", fontSize:11, color:saveStatus==="error"?"#c8001e":saveStatus==="saved"?"#2e8b57":"#bbb" }}>
              {saveStatus==="saving"&&"● Saving…"}{saveStatus==="saved"&&"✓ Saved"}{saveStatus==="error"&&"⚠ Save failed"}{!saveStatus&&"Auto-saves as you type"}
            </span>
            <button onClick={saveDraft} style={{ padding:"5px 14px", border:"1px solid #ddd", background:"#fff", cursor:"pointer", borderRadius:3, fontSize:12, color:"#555" }}>
              💾 Save Draft
            </button>
            {isPublished
              ? <button onClick={unpublish} style={{ padding:"5px 14px", border:"1px solid #aaa", background:"#fff", cursor:"pointer", borderRadius:3, fontSize:12, color:"#555" }}>🔒 Unpublish</button>
              : <button onClick={publish}   style={{ padding:"5px 14px", border:"none", background:"#c8001e", color:"#fff", cursor:"pointer", borderRadius:3, fontSize:12, fontWeight:600 }}>🌐 Publish</button>
            }
          </div>
        </div>
      </div>

      {showManager && (
        <ChapterManager chapters={chapters} activeIdx={activeIdx} onClose={()=>setShowManager(false)}
          onReorder={reorderChapters} onRename={(id,t)=>renameChapter(id,t)} onDelete={deleteChapter} onSwitch={switchChapter} />
      )}
    </div>
  );
}

// ─── AO3-STYLE VIEWER ────────────────────────────────────────────────────────
export function ProseViewer({ chapters, workTitle, authorName }) {
  const [idx, setIdx]     = useState(0);
  const [showTOC, setTOC] = useState(false);
  const topRef = useRef(null);
  const ch = chapters[idx];

  const go = i => { setIdx(i); setTOC(false); setTimeout(()=>topRef.current?.scrollIntoView({behavior:"smooth"}),50); };

  const navBtn = disabled => ({
    fontFamily:"Georgia,serif", fontSize:13, padding:"5px 14px",
    border:`1px solid ${disabled?"#ccc":"#900"}`,
    background:"#fff", color:disabled?"#bbb":"#900",
    cursor:disabled?"default":"pointer", borderRadius:2,
  });

  const NavBar = ({ top }) => (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 24px", borderTop:top?"none":"1px solid #ddd", borderBottom:top?"1px solid #ddd":"none", background:"#f9f9f9", flexWrap:"wrap", gap:8 }}>
      <button style={navBtn(idx===0)} disabled={idx===0} onClick={()=>go(idx-1)}>← Previous Chapter</button>
      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
        <span style={{ fontFamily:"Georgia,serif", fontSize:13, color:"#555" }}>Chapter {idx+1} of {chapters.length}</span>
        {chapters.length > 1 && (
          <button onClick={()=>setTOC(v=>!v)} style={{ fontFamily:"Georgia,serif", fontSize:13, padding:"5px 14px", border:"1px solid #555", background:"#fff", color:"#555", cursor:"pointer", borderRadius:2 }}>
            {showTOC?"▲ Hide Index":"▼ Chapter Index"}
          </button>
        )}
      </div>
      <button style={navBtn(idx===chapters.length-1)} disabled={idx===chapters.length-1} onClick={()=>go(idx+1)}>Next Chapter →</button>
    </div>
  );

  return (
    <div ref={topRef} style={{ background:"#fff", border:"1px solid #e0d8d0" }}>
      <ListStyles />
      <div style={{ width:"100%", paddingBottom:60 }}>
        <div style={{ textAlign:"center", padding:"40px 40px 0", borderBottom:"1px solid #900", width:"100%" }}>
          <div style={{ fontFamily:"Georgia,serif", fontSize:32, fontWeight:400, marginBottom:6, color:"#1a1a1a" }}>{workTitle}</div>
          {authorName&&<div style={{ fontFamily:"Georgia,serif", fontSize:16, color:"#555", marginBottom:20 }}>{authorName}</div>}
        </div>
        <NavBar top />
        {showTOC&&(
          <div style={{ background:"#f9f6f2", border:"1px solid #ddd", margin:"0 0", padding:"16px 24px" }}>
            <div style={{ fontFamily:"Georgia,serif", fontSize:14, fontWeight:700, marginBottom:10, color:"#333" }}>Chapter Index</div>
            {chapters.map((c,i)=>(
              <button key={c.id} onClick={()=>go(i)}
                style={{ display:"block", width:"100%", textAlign:"left", background:"none", border:"none", padding:"5px 0", fontFamily:"Georgia,serif", fontSize:14, color:i===idx?"#555":"#900", cursor:i===idx?"default":"pointer", borderBottom:"1px dotted #e0d8d0", fontWeight:i===idx?700:400 }}>
                {i+1}. {c.title}
              </button>
            ))}
          </div>
        )}
        <div style={{ textAlign:"center", padding:"24px 24px 0" }}>
          <div style={{ fontFamily:"Georgia,serif", fontSize:20, textDecoration:"underline", color:"#1a1a1a" }}>{ch.title}</div>
        </div>
        <div className="novel-content"
          style={{ padding:"24px 40px 32px", fontFamily:"Georgia,serif", fontSize:16, lineHeight:1.85, color:"#1a1a1a", textAlign:"justify" }}
          dangerouslySetInnerHTML={{ __html: ch?.content || "<i style='color:#bbb'>No content yet.</i>" }} />
        <NavBar top={false} />
      </div>
    </div>
  );
}