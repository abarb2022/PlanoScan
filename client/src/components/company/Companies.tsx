import { useEffect, useState } from "react";
import {
  createCompany,
  deleteCompany,
  getCompanies,
  updateCompany,
} from "../../services/companyService";
import type { Company } from "../../types/manager";
import ConfirmDialog from "../common/ConfirmDialog";
import "../store/Stores.css";
import CompanyDialog from "./CompanyDialog";

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [confirmCompany, setConfirmCompany] = useState<Company | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError("");
      setCompanies(await getCompanies());
    } catch {
      setError("Failed to load companies.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(name: string) {
    if (editingCompany) {
      const updated = await updateCompany(editingCompany.id, name);
      setCompanies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } else {
      const created = await createCompany(name);
      setCompanies((prev) => [created, ...prev]);
    }
  }

  async function confirmDelete() {
    if (!confirmCompany) return;
    const company = confirmCompany;
    setConfirmCompany(null);
    try {
      await deleteCompany(company.id);
      setCompanies((prev) => prev.filter((c) => c.id !== company.id));
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : "") || "Failed to delete company.");
    }
  }

  return (
    <div className="stores-page">
      <div className="stores-toolbar">
        <div className="toolbar-left">
          <h1 className="stores-title">Companies</h1>
          {!loading && (
            <span className="stores-count">
              {companies.length} compan{companies.length !== 1 ? "ies" : "y"}
            </span>
          )}
        </div>
        <div className="toolbar-right">
          <button
            className="btn btn-primary"
            onClick={() => { setEditingCompany(null); setDialogOpen(true); }}
          >
            <span>＋</span> Add Company
          </button>
        </div>
      </div>

      {error && <p className="stores-error">{error}</p>}

      <div className="stores-table-wrapper">
        <table className="stores-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="table-state">
                  <span className="spinner" /> Loading…
                </td>
              </tr>
            ) : companies.length === 0 ? (
              <tr>
                <td colSpan={3} className="table-state">No companies yet.</td>
              </tr>
            ) : (
              companies.map((c) => (
                <tr key={c.id} className="store-row">
                  <td>
                    <div className="store-cell">
                      <div className="store-avatar">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="store-name">{c.name}</div>
                        <div className="store-id">#{c.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-muted">{c.createdAt ?? "—"}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="icon-btn"
                        title="Edit"
                        onClick={() => { setEditingCompany(c); setDialogOpen(true); }}
                      >
                        ✎
                      </button>
                      <button
                        className="icon-btn icon-btn-danger"
                        title="Delete"
                        onClick={() => setConfirmCompany(c)}
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CompanyDialog
        open={dialogOpen}
        editingCompany={editingCompany}
        onClose={() => { setDialogOpen(false); setEditingCompany(null); }}
        onSubmit={handleSave}
      />

      <ConfirmDialog
        open={confirmCompany !== null}
        title="Delete Company"
        message={`Are you sure you want to delete "${confirmCompany?.name}"? This cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmCompany(null)}
      />
    </div>
  );
}
