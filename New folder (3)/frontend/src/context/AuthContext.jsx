import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getStoredUser, login, logout, register, restoreSession, updateStoredUser } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [sessionLoading, setSessionLoading] = useState(() => Boolean(getStoredUser()));
  useEffect(() => {
    let active = true;
    if (getStoredUser()) {
      restoreSession().then((current) => { if (active) setUser(current); })
        .catch((error) => { if (active && error.status === 401) setUser(null); })
        .finally(() => { if (active) setSessionLoading(false); });
    } else setSessionLoading(false);
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const expireSession = () => setUser(null);
    window.addEventListener("lti-auth-expired", expireSession);
    return () => window.removeEventListener("lti-auth-expired", expireSession);
  }, []);
  const signIn = async (input) => { const next = await login(input); setUser(next); return next; };
  const signUp = async (input) => { const next = await register(input); setUser(next); return next; };
  const signOut = () => { logout(); setUser(null); };
  const updateUser = (updates) => setUser((current) => current ? updateStoredUser(updates) : current);
  const value = useMemo(() => ({ user, sessionLoading, signIn, signUp, signOut, updateUser }), [user, sessionLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
