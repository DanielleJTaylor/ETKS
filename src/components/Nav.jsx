import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { Profiles } from "../lib/api";
import { useState, useEffect } from "react";
import AuthModals from "./AuthModals";

export default function Nav() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [modal, setModal]     = useState(null);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    if (!session?.user?.id) { setUsername(null); return; }
    Profiles.fetchMine(session.access_token, session.user.id).then(({ data }) => {
      setUsername(data?.username || null);
    });
  }, [session]);

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  return (
    <>
      <nav className="nav">
        <Link to="/" className="nav-logo">E<span>&</span>TKS</Link>
        <div className="nav-actions">
          <Link to="/browse" className="btn btn-ghost">Browse</Link>
          {session ? (
            <>
              {username
                ? <Link to={`/u/${username}`} className="nav-user" style={{ textDecoration:"none", color:"var(--gray-600)" }}>{username}</Link>
                : <span className="nav-user">{session.user?.email}</span>
              }
              <Link to="/dashboard" className="btn">My Works</Link>
              <button className="btn btn-ghost" onClick={handleSignOut}>Sign Out</button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={() => setModal("signin")}>Sign In</button>
              <button className="btn btn-primary" onClick={() => setModal("signup")}>Join Free</button>
            </>
          )}
        </div>
      </nav>
      {modal && <AuthModals initial={modal} onClose={() => setModal(null)} />}
    </>
  );
}
