export const SUPABASE_URL      = "https://vxgnzjfhtsccbagnabwc.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_Y4ZuFVz4Tqopb_c5Aurkbw_PxZUzzUQ";

// ─── HEADERS ─────────────────────────────────────────────────────────────────
export const anonH = () => ({ "Content-Type":"application/json", "apikey":SUPABASE_ANON_KEY });
export const authH = (t) => ({ ...anonH(), ...(t?{"Authorization":`Bearer ${t}`}:{}) });
export const dbH   = (t) => ({ ...authH(t), "Prefer":"return=representation" });
export const anonDbH = () => ({ ...anonH(), "Prefer":"return=representation" });

// ─── FETCH WITH TIMEOUT ───────────────────────────────────────────────────────
export async function apiFetch(url, opts={}, ms=10000) {
  const ctrl = new AbortController();
  const timer = setTimeout(()=>ctrl.abort(), ms);
  try {
    const res = await fetch(url, {...opts, signal:ctrl.signal});
    clearTimeout(timer);
    return res;
  } catch(e) {
    clearTimeout(timer);
    if (e.name==="AbortError") throw new Error("Request timed out.");
    throw e;
  }
}

// ─── SESSION ─────────────────────────────────────────────────────────────────
const SK = "etks_session";
export const getStored  = () => { try { return JSON.parse(localStorage.getItem(SK)); } catch { return null; } };
export const saveStored = (s) => localStorage.setItem(SK, JSON.stringify(s));
export const wipeStored = ()  => localStorage.removeItem(SK);

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const Auth = {
  signUp: async ({email,password}) => {
    try {
      const r = await apiFetch(`${SUPABASE_URL}/auth/v1/signup`,{method:"POST",headers:anonH(),body:JSON.stringify({email,password})});
      const j = await r.json();
      if (!r.ok) return {user:null,session:null,error:j.msg||j.error_description||"Sign up failed."};
      const s = j.access_token?{access_token:j.access_token,refresh_token:j.refresh_token}:null;
      if (s) saveStored({...s,user:j.user});
      return {user:j.user,session:s,error:null};
    } catch(e){return {user:null,session:null,error:e.message};}
  },
  signIn: async ({email,password}) => {
    try {
      const r = await apiFetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{method:"POST",headers:anonH(),body:JSON.stringify({email,password})});
      const j = await r.json();
      if (!r.ok) return {user:null,session:null,error:j.error_description||"Invalid email or password."};
      const s = {access_token:j.access_token,refresh_token:j.refresh_token};
      saveStored({...s,user:j.user});
      return {user:j.user,session:s,error:null};
    } catch(e){return {user:null,session:null,error:e.message};}
  },
  refresh: async (rt) => {
    const r = await apiFetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,{method:"POST",headers:anonH(),body:JSON.stringify({refresh_token:rt})});
    const j = await r.json();
    if (!r.ok){wipeStored();return null;}
    const s = {access_token:j.access_token,refresh_token:j.refresh_token};
    saveStored({...s,user:j.user});
    return {...s,user:j.user};
  },
  resetPassword: async (email,redirectTo) => {
    const r = await apiFetch(`${SUPABASE_URL}/auth/v1/recover`,{method:"POST",headers:anonH(),body:JSON.stringify({email,...(redirectTo?{redirect_to:redirectTo}:{})})});
    if (!r.ok){const j=await r.json();return j.msg||"Failed to send reset email.";}
    return null;
  },
  signOut: async (token) => {
    if (token) await apiFetch(`${SUPABASE_URL}/auth/v1/logout`,{method:"POST",headers:authH(token)});
    wipeStored();
  },
};

// ─── WORKS ────────────────────────────────────────────────────────────────────
export const Works = {
  fetchMine: async (token) => {
    try {
      const r = await apiFetch(`${SUPABASE_URL}/rest/v1/works?order=created_at.desc&select=*`,{headers:dbH(token)});
      if (!r.ok) return {data:[],error:"Failed to load works."};
      return {data:await r.json(),error:null};
    } catch(e){return {data:[],error:e.message};}
  },
  fetchOne: async (id, token) => {
    try {
      const headers = token ? dbH(token) : anonDbH();
      const r = await apiFetch(`${SUPABASE_URL}/rest/v1/works?id=eq.${id}&select=*&limit=1`,{headers});
      if (!r.ok) return {data:null,error:"Not found."};
      const rows = await r.json();
      return {data:rows[0]||null,error:rows[0]?null:"Not found."};
    } catch(e){return {data:null,error:e.message};}
  },
  fetchPublic: async ({andTags=[],orTags=[],excludeTags=[]}={}) => {
    try {
      let url = `${SUPABASE_URL}/rest/v1/works?visibility=eq.public&order=created_at.desc&select=*`;
      if (andTags.length>0)     url+=`&tags=cs.{${andTags.map(t=>t.replace(/,/g,"")).join(",")}}`;
      if (excludeTags.length>0) url+=`&tags=not.cs.{${excludeTags.map(t=>t.replace(/,/g,"")).join(",")}}`;
      const r = await apiFetch(url,{headers:anonDbH()});
      if (!r.ok){const j=await r.json();return {data:[],error:j.message||"Failed."};}
      let data = await r.json();
      if (orTags.length>0) data=data.filter(w=>orTags.some(t=>(w.tags||[]).includes(t)));
      if (data.length>0){
        const ids=data.map(w=>w.id).join(",");
        const rr=await apiFetch(`${SUPABASE_URL}/rest/v1/work_reactions?work_id=in.(${ids})&select=work_id,reaction`,{headers:anonDbH()});
        if (rr.ok){
          const rxns=await rr.json();
          const cm={};
          for(const rx of rxns){if(!cm[rx.work_id])cm[rx.work_id]={like_count:0,dislike_count:0};if(rx.reaction==="like")cm[rx.work_id].like_count++;if(rx.reaction==="dislike")cm[rx.work_id].dislike_count++;}
          data=data.map(w=>({...w,like_count:cm[w.id]?.like_count||0,dislike_count:cm[w.id]?.dislike_count||0}));
        }
        // Batch-fetch the first page/file per work (covers comic, visual-novel, pdf, gallery thumbnails)
        const thumbFormats = data.filter(w => ["comic","visual-novel","pdf","other"].includes(w.format)).map(w => w.id);
        if (thumbFormats.length > 0) {
          const fr = await apiFetch(`${SUPABASE_URL}/rest/v1/work_files?work_id=in.(${thumbFormats.join(",")})&order=work_id.asc,sort_order.asc&select=work_id,file_url,file_type`,{headers:anonDbH()});
          if (fr.ok) {
            const files = await fr.json();
            const firstByWork = {};
            for (const f of files) { if (!firstByWork[f.work_id]) firstByWork[f.work_id] = f; }
            data = data.map(w => firstByWork[w.id] ? { ...w, _thumb: firstByWork[w.id] } : w);
          }
        }
      }
      return {data,error:null};
    } catch(e){return {data:[],error:e.message};}
  },
  create: async (token,userId,payload) => {
    const r = await apiFetch(`${SUPABASE_URL}/rest/v1/works`,{method:"POST",headers:dbH(token),body:JSON.stringify({user_id:userId,title:payload.title,description:payload.description||null,format:payload.format,tags:payload.tags,visibility:payload.visibility})});
    if (!r.ok){const j=await r.json();return {data:null,error:j.message||"Failed to create."};}
    const rows=await r.json();return {data:rows[0],error:null};
  },
  update: async (token,workId,patch) => {
    const r = await apiFetch(`${SUPABASE_URL}/rest/v1/works?id=eq.${workId}`,{method:"PATCH",headers:dbH(token),body:JSON.stringify(patch)});
    if (!r.ok){const j=await r.json();return {data:null,error:j.message||"Update failed."};}
    const rows=await r.json();return {data:rows[0],error:null};
  },
  delete: async (token,workId) => {
    const r = await apiFetch(`${SUPABASE_URL}/rest/v1/works?id=eq.${workId}`,{method:"DELETE",headers:{...dbH(token),"Prefer":"return=minimal"}});
    return r.ok?{error:null}:{error:"Delete failed."};
  },
};

// ─── REACTIONS ────────────────────────────────────────────────────────────────
export const Reactions = {
  fetchMine: async (token,workIds) => {
    if (!token||!workIds.length) return {};
    const ids=workIds.map(id=>`"${id}"`).join(",");
    const r=await apiFetch(`${SUPABASE_URL}/rest/v1/work_reactions?work_id=in.(${ids})&select=work_id,reaction`,{headers:dbH(token)});
    if (!r.ok) return {};
    const rows=await r.json();
    return Object.fromEntries(rows.map(rx=>[rx.work_id,rx.reaction]));
  },
  react: async (token,userId,workId,reaction) => {
    await apiFetch(`${SUPABASE_URL}/rest/v1/work_reactions?user_id=eq.${userId}&work_id=eq.${workId}`,{method:"DELETE",headers:{...dbH(token),"Prefer":"return=minimal"}});
    if (reaction) await apiFetch(`${SUPABASE_URL}/rest/v1/work_reactions`,{method:"POST",headers:dbH(token),body:JSON.stringify({user_id:userId,work_id:workId,reaction})});
  },
};

// ─── WORK FILES ───────────────────────────────────────────────────────────────
export const WorkFiles = {
  fetch: async (workId) => {
    try {
      const r=await apiFetch(`${SUPABASE_URL}/rest/v1/work_files?work_id=eq.${workId}&order=sort_order.asc&select=*`,{headers:anonDbH()});
      if (!r.ok) return {data:[],error:"Failed to load files."};
      return {data:await r.json(),error:null};
    } catch(e){return {data:[],error:e.message};}
  },
  add: async (token,workId,userId,fileType,fileUrl,fileName,sortOrder=0,chapterId=null) => {
    const body={work_id:workId,user_id:userId,file_type:fileType,file_url:fileUrl,file_name:fileName,sort_order:sortOrder};
    if(chapterId) body.chapter_id=chapterId;
    const r=await apiFetch(`${SUPABASE_URL}/rest/v1/work_files`,{method:"POST",headers:dbH(token),body:JSON.stringify(body)});
    if (!r.ok) return {data:null,error:"Failed to save file."};
    return {data:(await r.json())[0],error:null};
  },
  fetchByChapter: async (workId, chapterId) => {
    try {
      const filter = chapterId ? `&chapter_id=eq.${encodeURIComponent(chapterId)}` : "";
      const r=await apiFetch(`${SUPABASE_URL}/rest/v1/work_files?work_id=eq.${workId}${filter}&order=sort_order.asc&select=*`,{headers:anonDbH()});
      if (!r.ok) return {data:[],error:"Failed to load files."};
      return {data:await r.json(),error:null};
    } catch(e){return {data:[],error:e.message};}
  },
  delete: async (token,fileId) => {
    const r=await apiFetch(`${SUPABASE_URL}/rest/v1/work_files?id=eq.${fileId}`,{method:"DELETE",headers:{...dbH(token),"Prefer":"return=minimal"}});
    return r.ok?{error:null}:{error:"Delete failed."};
  },
};

// ─── COMMENTS ─────────────────────────────────────────────────────────────────
export const Comments = {
  fetch: async (workId) => {
    try {
      const r=await apiFetch(`${SUPABASE_URL}/rest/v1/work_comments?work_id=eq.${workId}&order=created_at.asc&select=*`,{headers:anonDbH()});
      if (!r.ok) return {data:[],error:"Failed to load comments."};
      return {data:await r.json(),error:null};
    } catch(e){return {data:[],error:e.message};}
  },
  fetchCounts: async (workIds) => {
    if (!workIds.length) return {};
    try {
      const r=await apiFetch(`${SUPABASE_URL}/rest/v1/work_comments?work_id=in.(${workIds.join(",")})&select=work_id`,{headers:anonDbH()});
      if (!r.ok) return {};
      const rows=await r.json();
      const cm={};for(const x of rows)cm[x.work_id]=(cm[x.work_id]||0)+1;
      return cm;
    } catch(e){return {};}
  },
  add: async (token,workId,userId,content) => {
    const r=await apiFetch(`${SUPABASE_URL}/rest/v1/work_comments`,{method:"POST",headers:dbH(token),body:JSON.stringify({work_id:workId,user_id:userId,content})});
    if (!r.ok) return {data:null,error:"Failed to post."};
    return {data:(await r.json())[0],error:null};
  },
  delete: async (token,commentId) => {
    const r=await apiFetch(`${SUPABASE_URL}/rest/v1/work_comments?id=eq.${commentId}`,{method:"DELETE",headers:{...dbH(token),"Prefer":"return=minimal"}});
    return r.ok?{error:null}:{error:"Delete failed."};
  },
};

// ─── STORAGE ──────────────────────────────────────────────────────────────────
export const uploadToStorage = async (token,bucket,path,file) => {
  try {
    const r=await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`,{
      method:"POST",
      headers:{"Authorization":`Bearer ${token}`,"apikey":SUPABASE_ANON_KEY,"Content-Type":file.type||"application/octet-stream"},
      body:file,
    });
    if (!r.ok){const j=await r.json();return {url:null,error:j.message||"Upload failed. Make sure the 'work-files' storage bucket exists in Supabase."};}
    return {url:`${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`,error:null};
  } catch(e){return {url:null,error:e.message};}
};

// ─── PROFILES ─────────────────────────────────────────────────────────────────
export const Profiles = {
  fetchMine: async (token, userId) => {
    try {
      const r = await apiFetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*&limit=1`, { headers: dbH(token) });
      if (!r.ok) return { data: null, error: "Failed to load profile." };
      const rows = await r.json();
      return { data: rows[0] || null, error: null };
    } catch(e) { return { data: null, error: e.message }; }
  },
  fetchByIds: async (userIds) => {
    if (!userIds.length) return {};
    try {
      const ids = [...new Set(userIds)].join(",");
      const r = await apiFetch(`${SUPABASE_URL}/rest/v1/profiles?id=in.(${ids})&select=id,username`, { headers: anonDbH() });
      if (!r.ok) return {};
      const rows = await r.json();
      return Object.fromEntries(rows.map(p => [p.id, p.username || null]));
    } catch(e) { return {}; }
  },
  fetchByUsername: async (username) => {
    try {
      const r = await apiFetch(`${SUPABASE_URL}/rest/v1/profiles?username=eq.${encodeURIComponent(username)}&select=*&limit=1`, { headers: anonDbH() });
      if (!r.ok) return { data: null, error: "Not found." };
      const rows = await r.json();
      return { data: rows[0] || null, error: rows[0] ? null : "User not found." };
    } catch(e) { return { data: null, error: e.message }; }
  },
  update: async (token, userId, patch) => {
    const r = await apiFetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
      method: "PATCH", headers: dbH(token), body: JSON.stringify(patch),
    });
    if (!r.ok) { const j = await r.json(); return { data: null, error: j.message || "Update failed." }; }
    const rows = await r.json();
    return { data: rows[0], error: null };
  },
};