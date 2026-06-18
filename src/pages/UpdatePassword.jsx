import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../lib/api";

export default function UpdatePassword() {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [invalid, setInvalid] = useState(false);
  const navigate = useNavigate();

  // Supabase sends the token in the URL hash: #access_token=...&type=recovery
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", ""));
    const token = params.get("access_token");
    const type = params.get("type");
    if (token && type === "recovery") {
      setAccessToken(token);
    } else {
      setInvalid(true);
    }
  }, []);

  const submit = async () => {
    setError("");
    if (pw.length < 6) return setError("Min. 6 characters.");
    if (pw !== confirm) return setError("Passwords don't match.");
    setLoading(true);
    try {
      const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ password: pw }),
      });
      const j = await r.json();
      if (!r.ok) return setError(j.msg || j.error_description || "Failed to update password.");
      setDone(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
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
            <div className="modal-title">Set new password</div>
            <div className="modal-subtitle">Choose a strong password for your account.</div>
          </div>
          <div style={{ padding: 28 }}>
            {invalid ? (
              <>
                <div className="error-msg" style={{ marginBottom: 16 }}>This link is invalid or has expired.</div>
                <Link to="/forgot-password" className="btn btn-primary" style={{ display: "block", textAlign: "center", width: "100%" }}>
                  Request a new link
                </Link>
              </>
            ) : done ? (
              <>
                <div className="success-banner">✓ Password updated!</div>
                <p style={{ fontSize: 13, color: "var(--gray-600)", lineHeight: 1.6, marginBottom: 20 }}>
                  Redirecting you to sign in…
                </p>
              </>
            ) : (
              <>
                <div className="field">
                  <label className="label">New Password</label>
                  <input className="input" type="password" placeholder="Min. 6 characters" value={pw} onChange={e => setPw(e.target.value)} />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label className="label">Confirm Password</label>
                  <input className="input" type="password" placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
                </div>
                {error && <div className="error-msg">{error}</div>}
                <div style={{ marginTop: 22 }}>
                  <button className="btn btn-primary" style={{ width: "100%" }} onClick={submit} disabled={loading || !accessToken}>
                    {loading ? <><span className="spinner" /> Updating…</> : "Update Password"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}