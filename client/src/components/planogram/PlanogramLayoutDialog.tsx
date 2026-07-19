import type { Planogram, PlanogramShelf } from "../../types/planogram";
import "../store/StoreDialog.css";
import "./PlanogramLayoutDialog.css";

interface Props {
  planogram: Planogram;
  onClose: () => void;
}

export default function PlanogramLayoutDialog({ planogram, onClose }: Props) {
  const spec = planogram.layoutSpec;

  return (
    <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog layout-dialog" role="dialog" aria-modal="true">
        <div className="dialog-header layout-dialog-header">
          <div>
            <h2 className="dialog-title">{planogram.name}</h2>
            <p className="layout-dialog-subtitle">
              {spec ? `${spec.totalShelves} shelf${spec.totalShelves !== 1 ? "ves" : ""} · AI parsed layout` : "Parsed layout"}
            </p>
          </div>
          <button className="dialog-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="layout-dialog-body">
          {!spec ? (
            <p className="layout-empty">This planogram has not been parsed yet.</p>
          ) : (
            <>
              {spec.notes && (
                <div className="layout-notes">
                  <span className="layout-notes-icon">ℹ</span>
                  <p>{spec.notes}</p>
                </div>
              )}

              <div className="layout-shelves">
                {spec.shelves.map((shelf) => (
                  <ShelfCard key={shelf.number} shelf={shelf} />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="dialog-actions layout-dialog-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function ShelfCard({ shelf }: { shelf: PlanogramShelf }) {
  const totalFacings = shelf.sections.reduce((sum, s) => sum + s.facings, 0);

  return (
    <div className="shelf-card">
      <div className="shelf-card-header">
        <span className="shelf-label">Shelf {shelf.number}</span>
        <span className="shelf-meta">{shelf.sections.length} section{shelf.sections.length !== 1 ? "s" : ""} · {totalFacings} facings</span>
      </div>

      <div className="shelf-visual">
        {shelf.sections.map((s, i) => (
          <div
            key={i}
            className="shelf-section"
            style={{ flex: s.facings }}
            title={`${s.productName} (${s.facings} facings)`}
          >
            <span className="shelf-section-name">{s.productName}</span>
            <span className="shelf-section-facings">{s.facings}×</span>
          </div>
        ))}
      </div>

      <table className="shelf-table">
        <thead>
          <tr>
            <th>Position</th>
            <th>Product</th>
            <th className="col-right">Facings</th>
          </tr>
        </thead>
        <tbody>
          {shelf.sections.map((s, i) => (
            <tr key={i}>
              <td>
                <span className="position-badge">{s.position}</span>
              </td>
              <td>{s.productName}</td>
              <td className="col-right facings-val">{s.facings}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
