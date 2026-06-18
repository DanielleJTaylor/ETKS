import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { Profiles } from "../lib/api";
import { useState, useEffect } from "react";

export default function Nav() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(null);

  useEffect(() => {
    if (!session?.user?.id) { setUsername(null); return; }
    Profiles.fetchMine(session.access_token, session.user.id).then(({ data }) => {
      setUsername(data?.username || null);
    });
  }, [session]);

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  return (
    <nav className="nav">
      <Link to="/" className="nav-logo">E<span>&</span>TKS</Link>
      <div className="nav-actions">
        <Link to="/browse" className="btn btn-ghost">Browse</Link>
        {session ? (
          <>
            {username
              ? <Link to={`/u/${username}`} className="nav-user" style={{ textDecoration: "none", color: "var(--gray-600)" }}>{username}</Link>
              : <span className="nav-user">{session.user?.email}</span>
            }
            <Link to="/dashboard" className="btn">My Works</Link>
            <button className="btn btn-ghost" onClick={handleSignOut}>Sign Out</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost">Sign In</Link>
            <Link to="/signup" className="btn btn-primary">Join Free</Link>
          </>
        )}
      </div>
    </nav>
  );
}