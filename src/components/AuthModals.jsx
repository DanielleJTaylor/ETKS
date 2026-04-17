import { useState } from "react";
import { Auth, getStored } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

export default function AuthModals({ initial = "signin", onClose }) {
  const [view, setView] = useState(initial);
  const { signIn } = useAuth();

  if (view === "signup") return <SignUpModal onClose={onClose} onSwitch={() => setView("signin")} onSuccess={signIn} />;
  if (view === "reset")  return <ResetModal  onClose={onClose} onBack={() => setView("signin")} />;
  return <SignInModal onClose={onClose} onSwitch={() => setView("signup")} onReset={() => setView("reset")} onSuccess={signIn} />;
}

function SignUpModal({ onClose, onSwitch, onSuccess }) {
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [needsConfirm, setNeedsConfirm] = useState(false);
  const submit = async () => {
    setError("");
    if (!email) return setError("Email required."); if (pw.length<6) return setError("Min. 6 characters."); if (pw!==confirm) return setError("Passwords don't match.");
    setLoading(true);
    const {user,session,error:err} = await Auth.signUp({email,password:pw});
    setLoading(false);
    if (err) return setError(err);
    if (session) { onSuccess(user); onClose(); } else setNeedsConfirm(true);
  };
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header"><div><div className="modal-title">Create an account</div><div className="modal-subtitle">Publish your work to the archive.</div></div><button className="close-btn" onClick={onClose}>×</button></div>
        <div className="modal-body">
          {needsConfirm ? (<><div className="success-banner">✓ Check your email to confirm.</div><p style={{fontSize:13,color:"var(--gray-600)",lineHeight:1.6,marginBottom:20}}>A confirmation link was sent to <strong>{email}</strong>. Click it, then sign in.</p><button className="btn" style={{width:"100%"}} onClick={onClose}>Got it</button></>) : (<>
            <div className="field"><label className="label">Email</label><input className="input" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></div>
            <div className="field"><label className="label">Password</label><input className="input" type="password" placeholder="Min. 6 characters" value={pw} onChange={e=>setPw(e.target.value)}/></div>
            <div className="field" style={{marginBottom:0}}><label className="label">Confirm Password</label><input className="input" type="password" placeholder="Repeat password" value={confirm} onChange={e=>setConfirm(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
            {error&&<div className="error-msg">{error}</div>}
            <div style={{marginTop:22}}><button className="btn btn-primary" style={{width:"100%"}} onClick={submit} disabled={loading}>{loading?<><span className="spinner"/> Creating…</>:"Create Account"}</button></div>
          </>)}
          <div className="auth-footer">Already have an account?{" "}<button className="text-link" onClick={onSwitch}>Sign in</button></div>
        </div>
      </div>
    </div>
  );
}

function SignInModal({ onClose, onSwitch, onReset, onSuccess }) {
  const [email,setEmail]=useState(""); const [pw,setPw]=useState(""); const [loading,setLoading]=useState(false); const [error,setError]=useState("");
  const submit = async () => {
    setError(""); if (!email||!pw) return setError("Email and password required.");
    setLoading(true);
    const {user,error:err} = await Auth.signIn({email,password:pw});
    setLoading(false); if (err) return setError(err); onSuccess(user); onClose();
  };
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header"><div><div className="modal-title">Welcome back</div><div className="modal-subtitle">Sign in to your archive account.</div></div><button className="close-btn" onClick={onClose}>×</button></div>
        <div className="modal-body">
          <div className="field"><label className="label">Email</label><input className="input" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></div>
          <div className="field" style={{marginBottom:4}}><label className="label">Password</label><input className="input" type="password" placeholder="Your password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
          <div style={{textAlign:"right",marginBottom:18}}><button className="text-link" onClick={onReset}>Forgot password?</button></div>
          {error&&<div className="error-msg" style={{marginBottom:12}}>{error}</div>}
          <button className="btn btn-primary" style={{width:"100%"}} onClick={submit} disabled={loading}>{loading?<><span className="spinner"/> Signing in…</>:"Sign In"}</button>
          <div className="auth-footer">No account?{" "}<button className="text-link" onClick={onSwitch}>Create one</button></div>
        </div>
      </div>
    </div>
  );
}

function ResetModal({ onClose, onBack }) {
  const [email,setEmail]=useState(""); const [loading,setLoading]=useState(false); const [error,setError]=useState(""); const [sent,setSent]=useState(false);
  const submit = async () => {
    setError(""); if (!email) return setError("Email required.");
    setLoading(true); const err=await Auth.resetPassword(email,`${window.location.origin}/update-password`); setLoading(false);
    if (err) return setError(err); setSent(true);
  };
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header"><div><div className="modal-title">Reset password</div><div className="modal-subtitle">We'll send a reset link to your email.</div></div><button className="close-btn" onClick={onClose}>×</button></div>
        <div className="modal-body">
          {sent?(<><div className="success-banner">✓ Reset link sent.</div><p style={{fontSize:13,color:"var(--gray-600)",lineHeight:1.6,marginBottom:20}}>Check your inbox for <strong>{email}</strong>.</p><button className="btn" style={{width:"100%"}} onClick={onClose}>Done</button></>):(<>
            <div className="field"><label className="label">Email address</label><input className="input" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
            {error&&<div className="error-msg" style={{marginBottom:12}}>{error}</div>}
            <button className="btn btn-primary" style={{width:"100%"}} onClick={submit} disabled={loading}>{loading?<><span className="spinner"/> Sending…</>:"Send Reset Link"}</button>
            <div className="auth-footer"><button className="text-link" onClick={onBack}>Back to sign in</button></div>
          </>)}
        </div>
      </div>
    </div>
  );
}
