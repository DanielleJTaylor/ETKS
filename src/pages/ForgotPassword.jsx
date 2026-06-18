import { useState } from "react";
import { Link } from "react-router-dom";
import { Auth } from "../lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async () => {
    setError("");
    if (!email) return setError("Email required.");
    setLoading(true);
    const err = await Auth.resetPassword(email, `${window.location.origin}/update-password`);
    setLoading(false);
    if (err) return setError(err);
    setSent(true);
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
            <div className="modal-title">Reset password</div>
            <div className="modal-subtitle">We'll send a reset link to your email.</div>
          </div>
          <div style={{ padding: 28 }}>
            {sent ? (
              <>
                <div className="success-banner">✓ Reset link sent.</div>
                <p style={{ fontSize: 13, color: "var(--gray-600)", lineHeight: 1.6, marginBottom: 20 }}>
                  Check your inbox for <strong>{email}</strong>. The link will take you to a page to set your new password.
                </p>
                <Link to="/login" className="btn" style={{ display: "block", textAlign: "center", width: "100%" }}>Back to Sign In</Link>
              </>
            ) : (
              <>
                <div className="field">
                  <label className="label">Email address</label>
                  <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
                </div>
                {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}
                <button className="btn btn-primary" style={{ width: "100%" }} onClick={submit} disabled={loading}>
                  {loading ? <><span className="spinner" /> Sending…</> : "Send Reset Link"}
                </button>
                <div className="auth-footer">
                  <Link to="/login" className="text-link">Back to sign in</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}