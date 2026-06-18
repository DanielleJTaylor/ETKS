import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Auth } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const submit = async () => {
    setError("");
    if (!email || !pw) return setError("Email and password required.");
    setLoading(true);
    const { user, error: err } = await Auth.signIn({ email, password: pw });
    setLoading(false);
    if (err) return setError(err);
    signIn(user);
    navigate("/dashboard");
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
            <div className="modal-title">Welcome back</div>
            <div className="modal-subtitle">Sign in to your archive account.</div>
          </div>
          <div style={{ padding: 28 }}>
            <div className="field">
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: 6 }}>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="Your password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
            </div>
            <div style={{ textAlign: "right", marginBottom: 18 }}>
              <Link to="/forgot-password" className="text-link">Forgot password?</Link>
            </div>
            {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={submit} disabled={loading}>
              {loading ? <><span className="spinner" /> Signing in…</> : "Sign In"}
            </button>
            <div className="auth-footer">
              No account? <Link to="/signup" className="text-link">Create one</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}