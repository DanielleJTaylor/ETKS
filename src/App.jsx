import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "./lib/AuthContext";
import GlobalStyles from "./components/GlobalStyles";
import Nav from "./components/Nav";
import Landing from "./pages/Landing";
import Browse from "./pages/Browse";
import Dashboard from "./pages/Dashboard";
import WorkDetail from "./pages/WorkDetail";
import CreateWork from "./pages/CreateWork";
import EditWork from "./pages/EditWork";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import UpdatePassword from "./pages/UpdatePassword";

// Pages that have their own full-screen layout (no Nav)
const AUTH_PATHS = ["/login", "/signup", "/forgot-password", "/update-password"];

export default function App() {
  const isAuthPage = AUTH_PATHS.some(p => window.location.pathname.startsWith(p));

  // Safety net: if Supabase ever sends a recovery token to a path other than
  // /update-password (e.g. it falls back to the bare Site URL), catch it here
  // and redirect client-side so the link still works.
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery") && window.location.pathname !== "/update-password") {
      window.location.replace(`/update-password${hash}`);
    }
  }, []);

  return (
    <AuthProvider>
      <GlobalStyles />
      {!isAuthPage && <Nav />}
      <Routes>
        <Route path="/"                   element={<Landing />} />
        <Route path="/browse"             element={<Browse />} />
        <Route path="/dashboard"          element={<Dashboard />} />
        <Route path="/works/:id"          element={<WorkDetail />} />
        <Route path="/works/:id/edit"     element={<EditWork />} />
        <Route path="/create"             element={<CreateWork />} />
        <Route path="/u/:username"        element={<Profile />} />
        <Route path="/login"              element={<Login />} />
        <Route path="/signup"             element={<Signup />} />
        <Route path="/forgot-password"    element={<ForgotPassword />} />
        <Route path="/update-password"    element={<UpdatePassword />} />
        <Route path="*" element={
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 32, fontWeight: 700, marginBottom: 12 }}>404</div>
            <p style={{ color: "var(--gray-600)", marginBottom: 20 }}>Page not found.</p>
            <a href="/" className="btn btn-primary">Go Home</a>
          </div>
        } />
      </Routes>
    </AuthProvider>
  );
}