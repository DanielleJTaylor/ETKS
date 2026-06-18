import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Auth } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const submit = async () => {
    setError("");
    if (!email) return setError("Email required.");
    if (pw.length < 6) return setError("Min. 6 characters.");
    if (pw !== confirm) return setError("Passwords don't match.");
    setLoading(true);
    const { user, session, error: err } = await Auth.signUp({ email, password: pw });
    setLoading(false);
    if (err) return setError(err);
    if (session) { signIn(user); navigate("/dashboard"); }
    else setNeedsConfirm(true);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", background: "var(--off-white)" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link to="/" style={{ fontFamily: "var(--font-serif)", fontSize: 28, fontWeight: 700, color: "var(--black)", textDecoration: "none" }}>
            Everything <span style={{ color: "var(--red)" }}>&</span> The Kitchen Sink
          </Link>
        </div>
        <div style={{ background: "var(--white)", border: "var(--border)" }}>
          <div style={{ padding: "24px 28px 20px", borderBottom: "var(--border-thin)" }}>
            <div className="modal-title">Create an account</div>
            <div className="modal-subtitle">Publish your work to the archive.</div>
          </div>
          <div style={{ padding: 28 }}>
            {needsConfirm ? (
              <>
                <div className="success-banner">✓ Check your email to confirm.</div>
                <p style={{ fontSize: 13, color: "var(--gray-600)", lineHeight: 1.6, marginBottom: 20 }}>
                  A confirmation link was sent to <strong>{email}</strong>. Click it, then sign in.
                </p>
                <Link to="/login" className="btn" style={{ display: "block", width: "100%", textAlign: "center" }}>Go to Sign In</Link>
              </>
            ) : (
              <>
                <div className="field">
                  <label className="label">Email</label>
                  <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="field">
                  <label className="label">Password</label>
                  <input className="input" type="password" placeholder="Min. 6 characters" value={pw} onChange={e => setPw(e.target.value)} />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label className="label">Confirm Password</label>
                  <input className="input" type="password" placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
                </div>
                {error && <div className="error-msg">{error}</div>}
                <div style={{ marginTop: 22 }}>
                  <button className="btn btn-primary" style={{ width: "100%" }} onClick={submit} disabled={loading}>
                    {loading ? <><span className="spinner" /> Creating…</> : "Create Account"}
                  </button>
                </div>
                <div className="auth-footer">
                  Already have an account? <Link to="/login" className="text-link">Sign in</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}