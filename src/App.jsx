import { Routes, Route } from "react-router-dom";
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

export default function App() {
  return (
    <AuthProvider>
      <GlobalStyles />
      <Nav />
      <Routes>
        <Route path="/"               element={<Landing />} />
        <Route path="/browse"         element={<Browse />} />
        <Route path="/dashboard"      element={<Dashboard />} />
        <Route path="/works/:id"      element={<WorkDetail />} />
        <Route path="/works/:id/edit" element={<EditWork />} />
        <Route path="/create"         element={<CreateWork />} />
        <Route path="/u/:username"     element={<Profile />} />
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
