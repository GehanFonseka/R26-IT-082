import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getStoredUser, login, logout, register, updateStoredUser } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  useEffect(() => {
    const expireSession = () => setUser(null);
    window.addEventListener("lti-auth-expired", expireSession);
    return () => window.removeEventListener("lti-auth-expired", expireSession);
  }, []);
  const signIn = async (input) => { const next = await login(input); setUser(next); return next; };
  const signUp = async (input) => { const next = await register(input); setUser(next); return next; };
  const signOut = () => { logout(); setUser(null); };
  const updateUser = (updates) => setUser((current) => current ? updateStoredUser(updates) : current);
  const value = useMemo(() => ({ user, signIn, signUp, signOut, updateUser }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
