import { Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

const FEATURES = [
  { icon: "!", title: "Any Format",       desc: "Comics, prose, PDFs, visual novels, galleries — publish it your way." },
  { icon: "?", title: "Find It Fast",     desc: "AND / OR / EXCLUDE tags. Zero in on exactly your next read." },
  { icon: "★", title: "Private First",    desc: "Drafts stay hidden till you're ready to go public." },
  { icon: "$", title: "Always Free",      desc: "No paywalls, no algorithmic feeds. Just the open archive." },
];

const heroStyle = {
  position: "relative",
  padding: "60px 28px",
  textAlign: "center",
  overflow: "hidden",
  borderBottom: "var(--border)",
  backgroundImage: "radial-gradient(#111 0.8px, transparent 0.8px)",
  backgroundSize: "6px 6px",
  backgroundColor: "#fff",
};

const burstStyle = {
  position: "absolute",
  top: 20,
  right: 60,
  width: 140,
  height: 140,
  background: "#ffde17",
  clipPath: "polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transform: "rotate(8deg)",
};

const speechStyle = {
  display: "inline-block",
  background: "#fff",
  border: "4px solid #111",
  borderRadius: 30,
  padding: "8px 24px",
  fontWeight: 700,
  fontSize: 13,
  marginBottom: 24,
};

const titleStyle = {
  fontFamily: "var(--font-serif)",
  fontSize: "clamp(42px, 7vw, 68px)",
  lineHeight: 0.95,
  letterSpacing: 1,
  marginBottom: 18,
};

const popStyle = {
  color: "#ed1c24",
  WebkitTextStroke: "2px #111",
};

export default function Landing() {
  const { session } = useAuth();

  return (
    <div>
      {/* Hero */}
      <div style={heroStyle}>
        <div style={burstStyle}>
          <span style={{ fontFamily: "var(--font-serif)", fontSize: 13, transform: "rotate(-8deg)", textAlign: "center", lineHeight: 1.1 }}>
            NOW<br />OPEN!
          </span>
        </div>

        <div style={speechStyle}>★ Every story format welcome ★</div>

        <h1 style={titleStyle}>
          EVERYTHING<br />
          &amp; THE <span style={popStyle}>KITCHEN SINK!</span>
        </h1>

        <p style={{ maxWidth: 480, margin: "0 auto 30px", fontSize: 14, lineHeight: 1.6, color: "#333" }}>
          Prose, comics, visual novels, recipes, and more — all in one archive,
          tagged so readers find exactly your kind of story.
        </p>

        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/browse" className="btn btn-red" style={{ fontSize: 14, padding: "12px 26px" }}>
            Browse Works →
          </Link>
          {session ? (
            <Link to="/dashboard" className="btn" style={{ fontSize: 14, padding: "12px 26px", background: "#ffde17", borderColor: "#111" }}>
              My Works
            </Link>
          ) : (
            <Link to="/signup" className="btn" style={{ fontSize: 14, padding: "12px 26px", background: "#ffde17", borderColor: "#111" }}>
              Start Creating
            </Link>
          )}
        </div>
      </div>

      {/* Feature panels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, borderTop: "var(--border)", padding: 4, background: "#f4f4f4" }}>
        {FEATURES.map(f => (
          <div key={f.title} style={{ border: "3px solid #111", padding: "24px 18px", textAlign: "center", borderRadius: 6, background: "#fff" }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 30, color: "#ed1c24", marginBottom: 8 }}>{f.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>{f.title}</div>
            <div style={{ fontSize: 11.5, lineHeight: 1.5, color: "#444" }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* CTA strip */}
      {!session && (
        <div style={{ textAlign: "center", padding: 36, borderTop: "var(--border)", background: "#111" }}>
          <Link
            to="/signup"
            style={{
              display: "inline-block",
              background: "#ffde17",
              border: "4px solid #111",
              borderRadius: 30,
              padding: "14px 32px",
              fontFamily: "var(--font-serif)",
              fontSize: 20,
              color: "#111",
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            START YOUR FIRST WORK →
          </Link>
        </div>
      )}
    </div>
  );
}