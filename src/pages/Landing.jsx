import { Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { useState } from "react";
import AuthModals from "../components/AuthModals";

const FEATURES = [
  { icon: "📖", title: "Every Format",       desc: "Prose with chapters, comics, visual novels, PDFs, and image galleries." },
  { icon: "🏷️", title: "Tag-Based Search",   desc: "AND, OR, EXCLUDE logic. Find exactly what you want, nothing else." },
  { icon: "🔒", title: "Private by Default", desc: "Works start private. You decide when anything goes public." },
  { icon: "🆓", title: "Free to Use",        desc: "No paywalls, no algorithmic feeds. Just an open archive you control." },
];

export default function Landing() {
  const { session } = useAuth();
  const [modal, setModal] = useState(null);

  return (
    <div>
      <div className="landing-hero">
        <div className="hero-eyebrow">Open Creative Archive · Est. 2025</div>
        <h1 className="hero-title">Everything &amp; The<br /><em>Kitchen Sink</em></h1>
        <p className="hero-sub">
          A home for every format of creative work. Publish anything, tag precisely,
          and let readers find exactly what they're looking for.
        </p>
        <div className="hero-actions">
          <Link to="/browse" className="btn btn-primary" style={{ padding: "13px 32px", fontSize: 14 }}>Browse Works</Link>
          {session ? (
            <Link to="/dashboard" className="btn" style={{ padding: "13px 28px", fontSize: 14 }}>My Works</Link>
          ) : (
            <>
              <button className="btn" style={{ padding: "13px 28px", fontSize: 14 }} onClick={() => setModal("signin")}>Sign In</button>
              <button className="btn btn-red" style={{ padding: "13px 28px", fontSize: 14 }} onClick={() => setModal("signup")}>Join Free</button>
            </>
          )}
        </div>
      </div>
      <div className="section-label">What the archive supports</div>
      <div className="features-grid">
        {FEATURES.map(f => (
          <div className="feature-card" key={f.title}>
            <div className="feature-icon">{f.icon}</div>
            <div className="feature-title">{f.title}</div>
            <div className="feature-desc">{f.desc}</div>
          </div>
        ))}
      </div>
      {!session && (
        <div style={{ borderTop: "var(--border)", padding: "32px", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "var(--gray-400)", marginBottom: 16 }}>Ready to publish?</p>
          <button className="btn btn-red" onClick={() => setModal("signup")}>Create a Free Account</button>
        </div>
      )}
      {modal && <AuthModals initial={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
