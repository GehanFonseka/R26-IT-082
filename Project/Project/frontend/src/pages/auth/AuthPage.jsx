import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AuthPage.css";

function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ displayName: "", email: "", password: "", role: "user", adminCode: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const action = mode === "login" ? signIn : signUp;
      const nextUser = await action(mode === "login" ? { email: form.email, password: form.password } : form);
      navigate(location.state?.from || (nextUser?.role === "admin" ? "/admin" : "/jobs"), { replace: true });
    } catch (requestError) { setError(requestError.message); } finally { setBusy(false); }
  };
  return <main className="auth-page"><section className="auth-card"><p className="cv-overline">Lanka Talent Insights</p><h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1><p className="auth-card__intro">Use your own account to keep your profile and recruitment data isolated.</p><form onSubmit={submit}>{mode === "register" && <><label>Display name<input name="displayName" value={form.displayName} onChange={update} required /></label><label>Account type<select name="role" value={form.role} onChange={update}><option value="user">User</option><option value="admin">Admin</option></select></label>{form.role === "admin" && <label>Admin invite code<input name="adminCode" type="password" value={form.adminCode} onChange={update} required /></label>}</>}<label>Email<input name="email" type="email" value={form.email} onChange={update} required /></label><label>Password<input name="password" type="password" minLength="8" value={form.password} onChange={update} required /></label>{error && <p className="auth-card__error">{error}</p>}<button className="cv-button cv-button--primary" disabled={busy}>{busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}</button></form><button className="auth-card__switch" type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "Need an account? Register" : "Already have an account? Sign in"}</button></section></main>;
}

export default AuthPage;
