import { createContext, useContext, useState, useEffect } from "react";
import { Auth, getStored, saveStored } from "./api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStored();
    if (stored?.refresh_token) {
      Auth.refresh(stored.refresh_token).then(s => {
        if (s) setSession(s);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = (user) => {
    const stored = getStored();
    if (stored) setSession({ ...stored, user });
  };

  const signOut = async () => {
    await Auth.signOut(session?.access_token);
    setSession(null);
  };

  return (
    <AuthCtx.Provider value={{ session, loading, signIn, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
}
