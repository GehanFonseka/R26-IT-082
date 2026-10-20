import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import CvNavigation from "../../components/layout/CvNavigation";
import CvTopbar from "../../components/layout/CvTopbar";
import Icon from "../../components/common/Icon";
import { createCompanyAdmin, deleteCompanyAdmin, listCompanyAdmins } from "../../services/companyService";
import "./CompanyAdminsPage.css";

const emptyForm = { displayName: "", email: "", password: "" };
const initials = (name) => String(name || "Admin").trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

export default function CompanyAdminsPage() {
  const { user } = useAuth();
  const canManage = user.accountType === "company";
  const navigate = useNavigate();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const visibleAdmins = admins.filter((admin) => `${admin.displayName} ${admin.email}`.toLowerCase().includes(query.trim().toLowerCase()));
  useEffect(() => {
    let active = true;
    setLoading(true); setLoadError("");
    listCompanyAdmins().then((data) => { if (active) setAdmins(data); })
      .catch((failure) => { if (active) setLoadError(failure.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError(""); setStatus("");
    try {
      const admin = await createCompanyAdmin(form);
      setAdmins((current) => [admin, ...current]); setForm(emptyForm);
      setStatus("Admin account created. They can sign in with their email and password.");
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  const removeAdmin = async () => {
    setBusy(true); setError(""); setStatus("");
    try {
      await deleteCompanyAdmin(pendingDelete.id);
      setAdmins((current) => current.filter((admin) => admin.id !== pendingDelete.id));
      setStatus(`${pendingDelete.displayName}'s admin account was deleted.`); setPendingDelete(null);
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  const navigateFromSidebar = (view) => navigate({ admin: "/admin", "admin-jobs": "/admin/jobs", "admin-applications": "/admin/applications", "admin-attrition": "/admin/attrition", "admin-interviews": "/admin/interviews", "admin-interview-results": "/admin/interview-results" }[view] || "/admin");
  return <div className="cv-app-shell admin-app-shell company-admins-shell">
    <CvNavigation isOpen={navigationOpen} activeView="admin-management" onNavigate={navigateFromSidebar} onClose={() => setNavigationOpen(false)} />
    <div className="cv-app-shell__main admin-app-shell__main">
    <CvTopbar activeView="admin-management" onMenuToggle={() => setNavigationOpen(true)} />
    <main className="company-admins">
    <header className="company-admins__hero"><div><span className="company-admins__overline"><Icon name="briefcase" size={13} />{user.companyName || "Company"} / Company workspace</span><h1>{canManage ? "Admin Management" : "Company admins"}</h1><p>{canManage ? "Build your hiring team. Manage the people who keep recruitment moving." : "Meet the people behind your company's recruitment workspace."}</p><span className="company-admins__access"><Icon name="shield" size={14} />{canManage ? "Company owner · Manage team access" : "Company administrator · Team directory"}</span></div><div className="company-admins__count"><span className="company-admins__count-icon"><Icon name="people" size={22} /></span><strong>{loading || loadError ? "—" : admins.length}</strong><span>Company admins</span></div></header>
    {error && <p className="company-admins__error" role="alert">{error}</p>}
    {status && <p className="company-admins__success" role="status"><Icon name="check" size={16} />{status}</p>}
    <div className={`company-admins__grid ${canManage ? "" : "company-admins__grid--list"}`}>
      {canManage && <section className="company-admins__create"><span className="company-admins__section-icon"><Icon name="plus" size={21} /></span><h2>Add a new admin</h2><p>Give a teammate access to the recruitment workspace. Only the company owner can manage accounts.</p>
        <form onSubmit={submit}>
          <fieldset disabled={busy}>
          <label htmlFor="admin-name">Display name<input id="admin-name" name="displayName" value={form.displayName} onChange={update} autoComplete="off" minLength="2" required /></label>
          <label htmlFor="admin-email">Email<input id="admin-email" name="email" type="email" value={form.email} onChange={update} autoComplete="off" required /></label>
          <label htmlFor="admin-password">Password<input id="admin-password" name="password" type="password" value={form.password} onChange={update} autoComplete="new-password" minLength="8" required /></label>
          <button type="submit" disabled={loading || Boolean(loadError) || Boolean(pendingDelete)}><Icon name="plus" size={16} />{busy && !pendingDelete ? "Creating..." : "Add admin"}</button>
          </fieldset>
        </form>
      </section>}
      <section className="company-admins__directory" aria-busy={loading}><div className="company-admins__directory-heading"><div><span className="company-admins__overline">Your hiring team</span><h2>Team directory {!loading && !loadError && <span className="company-admins__badge">{admins.length}</span>}</h2><p>Company administrators in one place.</p></div><span className="company-admins__section-icon"><Icon name="people" size={21} /></span></div>
        {!loading && !loadError && admins.length > 0 && <label className="company-admins__search" htmlFor="admin-search"><Icon name="search" size={16} /><input id="admin-search" value={query} onChange={(event) => setQuery(event.target.value)} type="search" aria-label="Search admins by name or email" placeholder="Search by name or email" /></label>}
        {loading ? <p className="company-admins__empty" role="status">Loading admins...</p> : loadError ? <div><p className="company-admins__error" role="alert">{loadError}</p><button type="button" onClick={() => setReloadKey((current) => current + 1)}>Retry</button></div> : visibleAdmins.length ? <ul>{visibleAdmins.map((admin, index) => <li key={admin.id}>
          <div className={`company-admins__avatar company-admins__avatar--${index % 4}`} aria-hidden="true">{initials(admin.displayName)}</div>
          <div className="company-admins__identity"><strong>{admin.displayName}{admin.id === user.id && <small>You</small>}</strong><span>{admin.email}</span><b>Company admin</b></div>
          {canManage && <button className="company-admins__delete" type="button" disabled={busy || Boolean(pendingDelete)} aria-label={`Delete ${admin.displayName}`} onClick={() => { setPendingDelete(admin); setError(""); setStatus(""); }}>Delete</button>}
          {pendingDelete?.id === admin.id && <div className="company-admins__confirmation" role="group" aria-label={`Confirm deletion of ${admin.displayName}`}>
            <p>Delete {admin.displayName}'s admin account? They will lose access to this workspace. This cannot be undone.</p>
            <div><button type="button" disabled={busy} onClick={removeAdmin}>{busy ? "Deleting..." : "Confirm delete"}</button><button className="company-admins__cancel" type="button" disabled={busy} onClick={() => setPendingDelete(null)}>Cancel</button></div>
          </div>}
        </li>)}</ul> : <div className="company-admins__empty"><Icon name="people" size={28} /><strong>{admins.length ? "No matching admins" : "Your team starts here"}</strong><p>{admins.length ? "Try a different name or email." : canManage ? "Add your first admin account to build your hiring team." : "No admins found in your company."}</p></div>}
      </section>
    </div>
  </main></div></div>;
}
