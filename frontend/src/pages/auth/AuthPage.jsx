import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import artwork from "../../assets/auth-login-artwork.png";
import "./AuthPage.css";

function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ displayName: "", email: "", password: "", role: "user", adminCode: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const action = mode === "login" ? signIn : signUp;
      const nextUser = await action(mode === "login" ? { email: form.email, password: form.password } : form);
      navigate(location.state?.from || (nextUser?.role === "admin" ? "/admin" : "/jobs"), { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };
  const isLogin = mode === "login";
  return (
    <main className="auth-page">
      <section className={`auth-layout${isLogin ? "" : " auth-layout--register"}`} aria-label="MatchOS Talent Workspace account access">
        <aside className="auth-visual">
          <img src={artwork} alt="Abstract red paper-cut profile with layered resume sheets" />
          <div className="auth-visual__caption">
            <span className="auth-visual__eyebrow"><i /> MatchOS Talent Workspace</span>
            <h2>Make every<br /><em>hire</em> count.</h2>
            <p>Bring your best people decisions into one clear workspace.</p>
          </div>
        </aside>

        <section className="auth-card">
          <div className="auth-brand" aria-label="MatchOS Talent Workspace">
            <span className="auth-brand__mark" aria-hidden="true"><span /></span>
            <span><strong>MatchOS</strong><small>Talent Workspace</small></span>
          </div>
          <div className="auth-card__heading">
            <p className="auth-card__eyebrow">Recruiter portal</p>
            <h1>{isLogin ? "Welcome back." : "Create your account."}</h1>
            <p>{isLogin ? "Sign in to continue building better teams." : "Set up your workspace and start making confident decisions."}</p>
          </div>

          <form onSubmit={submit}>
            {mode === "register" && <>
              <label htmlFor="displayName">Display name<input id="displayName" name="displayName" autoComplete="name" value={form.displayName} onChange={update} required /></label>
              <label htmlFor="role">Account type<select id="role" name="role" value={form.role} onChange={update}><option value="user">User</option><option value="admin">Admin</option></select></label>
              {form.role === "admin" && <label htmlFor="adminCode">Admin invite code<input id="adminCode" name="adminCode" type="password" autoComplete="one-time-code" value={form.adminCode} onChange={update} required /></label>}
            </>}
            <label htmlFor="email">Email address<input id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" value={form.email} onChange={update} required /></label>
            <label htmlFor="password">Password<input id="password" name="password" type="password" autoComplete={isLogin ? "current-password" : "new-password"} placeholder="Enter your password" minLength="8" value={form.password} onChange={update} required /></label>
            {error && <p className="auth-card__error" role="alert">{error}</p>}
            <button className="auth-submit" disabled={busy}>{busy ? "Please wait..." : isLogin ? "Sign in" : "Create account"}<span aria-hidden="true">→</span></button>
          </form>

          <p className="auth-card__switch">{isLogin ? "New to MatchOS?" : "Already have an account?"} <button type="button" onClick={() => { setMode(isLogin ? "register" : "login"); setError(""); }}>{isLogin ? "Create an account" : "Sign in"}</button></p>
          <p className="auth-card__secure"><span aria-hidden="true">●</span> Your recruitment workspace is private and secure.</p>
        </section>
      </section>
    </main>
  );
}

export default AuthPage;
