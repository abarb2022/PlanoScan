import { useEffect, useMemo, useState } from "react";
import type { Planogram, PlanogramShelf, SectionProductLink } from "../../types/planogram";
import type { Product } from "../../types/product";
import { getProducts } from "../../services/productService";
import { linkPlanogramProducts } from "../../services/planogramService";
import { resolveAssetUrl } from "../../services/apiClient";
import ProductPicker from "./ProductPicker";
import BackButton from "../common/BackButton";
import "../store/Stores.css";
import "../store/StoreDialog.css";
import "./PlanogramDetail.css";

interface Props {
  planogram: Planogram;
  onBack: () => void;
  onUpdated: (planogram: Planogram) => void;
}

interface PickerTarget {
  shelfNumber: number;
  position: string;
  productName: string;
}

function linkKey(shelfNumber: number, position: string): string {
  return `${shelfNumber}::${position.toLowerCase()}`;
}

export default function PlanogramDetail({ planogram, onBack, onUpdated }: Props) {
  const [spec, setSpec] = useState(planogram.layoutSpec);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    setSpec(planogram.layoutSpec);
    const initial: Record<string, string> = {};
    planogram.layoutSpec?.shelves.forEach((shelf) => {
      shelf.sections.forEach((section) => {
        if (section.productId) {
          initial[linkKey(shelf.number, section.position)] = section.productId;
        }
      });
    });
    setLinks(initial);
    setDirty(false);
    setError("");
  }, [planogram]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoadingProducts(true);
        const res = await getProducts(0, 200, planogram.companyId);
        if (!cancelled) setProducts(res.content);
      } catch {
        if (!cancelled) setError("Failed to load products for linking.");
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [planogram.companyId]);

  const productsById = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  const linkedCount = useMemo(() => Object.keys(links).length, [links]);
  const totalSections = useMemo(
    () => spec?.shelves.reduce((sum, s) => sum + s.sections.length, 0) ?? 0,
    [spec],
  );

  function handleSelect(productId: string | null) {
    if (!pickerTarget) return;
    const key = linkKey(pickerTarget.shelfNumber, pickerTarget.position);
    setLinks((prev) => {
      const next = { ...prev };
      if (productId) next[key] = productId;
      else delete next[key];
      return next;
    });
    setDirty(true);
    setPickerTarget(null);
  }

  async function handleSave() {
    if (!spec) return;
    const payload: SectionProductLink[] = [];
    spec.shelves.forEach((shelf) => {
      shelf.sections.forEach((section) => {
        payload.push({
          shelfNumber: shelf.number,
          position: section.position,
          productId: links[linkKey(shelf.number, section.position)] ?? null,
        });
      });
    });

    try {
      setSaving(true);
      setError("");
      const updated = await linkPlanogramProducts(planogram.id, payload);
      setSpec(updated.layoutSpec);
      setDirty(false);
      onUpdated(updated);
    } catch {
      setError("Failed to save product links.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="planogram-detail">
      <div className="pd-header">
        <BackButton label="Back to Planograms" onClick={onBack} />

        <div className="pd-header-main">
          <div
            className={`pd-hero-image ${planogram.referenceImageUrl ? "pd-hero-clickable" : ""}`}
            onClick={() =>
              planogram.referenceImageUrl &&
              setLightbox({ src: resolveAssetUrl(planogram.referenceImageUrl), alt: planogram.name })
            }
          >
            {planogram.referenceImageUrl ? (
              <img src={resolveAssetUrl(planogram.referenceImageUrl)} alt={planogram.name} />
            ) : (
              <span>{planogram.name.slice(0, 2).toUpperCase()}</span>
            )}
          </div>

          <div className="pd-header-info">
            <h1 className="pd-title">{planogram.name}</h1>
            {spec?.notes && <p className="pd-description">{spec.notes}</p>}
            <div className="pd-meta-row">
              {planogram.storeName && <span className="pd-badge">{planogram.storeName}</span>}
              {planogram.productCategory && <span className="pd-badge pd-badge-muted">{planogram.productCategory}</span>}
              <span className={`pd-badge ${planogram.active ? "pd-badge-success" : "pd-badge-muted"}`}>
                {planogram.active ? "Active" : "Inactive"}
              </span>
              {spec && (
                <span className="pd-badge pd-badge-muted">
                  {spec.totalShelves} shelf{spec.totalShelves !== 1 ? "ves" : ""} · {totalSections} section{totalSections !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            {(planogram.validFrom || planogram.validUntil) && (
              <p className="pd-valid-period">
                Valid: {planogram.validFrom ?? "∞"} → {planogram.validUntil ?? "∞"}
              </p>
            )}
          </div>

          <div className="pd-header-actions">
            {spec && (
              <span className="pd-progress">
                {linkedCount}/{totalSections} products linked
              </span>
            )}
            <button className="btn btn-primary" onClick={handleSave} disabled={!dirty || saving || !spec}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      <div className="pd-body">
        {error && <p className="stores-error">{error}</p>}

        {!spec ? (
          <div className="pd-empty">
            <span className="pd-empty-icon">⏳</span>
            <p>This planogram hasn't been parsed by AI yet. Once parsing finishes, its shelf sections will appear here for product linking.</p>
          </div>
        ) : (
          <>
            <div className="pd-notes pd-notes-hint">
              <span>🔗</span>
              <p>
                Link each shelf section to a catalog product. The scoring AI only receives the
                reference photos you link here — sections left unlinked won't be checked against
                a specific product image.
              </p>
            </div>

            <div className="pd-shelves">
              {spec.shelves.map((shelf) => (
                <ShelfSectionCard
                  key={shelf.number}
                  shelf={shelf}
                  links={links}
                  productsById={productsById}
                  onOpenPicker={(position, productName) =>
                    setPickerTarget({ shelfNumber: shelf.number, position, productName })
                  }
                  onZoomProduct={(src, alt) => setLightbox({ src, alt })}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <ProductPicker
        open={pickerTarget !== null}
        title={pickerTarget ? `Shelf ${pickerTarget.shelfNumber} · ${pickerTarget.position} — detected "${pickerTarget.productName}"` : ""}
        products={products}
        loading={loadingProducts}
        selectedProductId={
          pickerTarget ? links[linkKey(pickerTarget.shelfNumber, pickerTarget.position)] ?? null : null
        }
        onSelect={handleSelect}
        onClose={() => setPickerTarget(null)}
      />

      {lightbox && (
        <div className="pd-lightbox-backdrop" onClick={() => setLightbox(null)}>
          <img className="pd-lightbox-image" src={lightbox.src} alt={lightbox.alt} />
        </div>
      )}
    </div>
  );
}

function ShelfSectionCard({
  shelf,
  links,
  productsById,
  onOpenPicker,
  onZoomProduct,
}: {
  shelf: PlanogramShelf;
  links: Record<string, string>;
  productsById: Map<string, Product>;
  onOpenPicker: (position: string, productName: string) => void;
  onZoomProduct: (src: string, alt: string) => void;
}) {
  const totalFacings = shelf.sections.reduce((sum, s) => sum + s.facings, 0);

  return (
    <div className="pd-shelf-card">
      <div className="pd-shelf-header">
        <span className="pd-shelf-label">Shelf {shelf.number}</span>
        <span className="pd-shelf-meta">
          {shelf.sections.length} section{shelf.sections.length !== 1 ? "s" : ""} · {totalFacings} facings
        </span>
      </div>

      <div className="pd-sections">
        {shelf.sections.map((s, i) => {
          const key = linkKey(shelf.number, s.position);
          const productId = links[key];
          const product = productId ? productsById.get(productId) : undefined;

          return (
            <div key={i} className="pd-section-row">
              <div className="pd-section-info">
                <span className="position-badge">{s.position}</span>
                <div className="pd-section-detected">
                  <span className="pd-section-name">{s.productName}</span>
                  <span className="pd-section-sub">AI-detected · {s.facings}× facings</span>
                </div>
              </div>

              <button
                className={`pd-link-slot ${product ? "pd-link-slot-filled" : "pd-link-slot-empty"}`}
                onClick={() => onOpenPicker(s.position, s.productName)}
              >
                {product ? (
                  <>
                    {product.referenceImageUrl ? (
                      <img
                        className="pd-link-thumb"
                        src={resolveAssetUrl(product.referenceImageUrl)}
                        alt={product.name}
                        onClick={(e) => {
                          e.stopPropagation();
                          onZoomProduct(resolveAssetUrl(product.referenceImageUrl!), product.name);
                        }}
                      />
                    ) : (
                      <div className="pd-link-thumb pd-link-thumb-placeholder">
                        {product.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="pd-link-text">
                      <span className="pd-link-name">{product.name}</span>
                      {product.sku && <span className="pd-link-sku">SKU: {product.sku}</span>}
                    </div>
                    <span className="pd-link-edit">Change</span>
                  </>
                ) : (
                  <>
                    <div className="pd-link-thumb pd-link-thumb-empty">🖼</div>
                    <span className="pd-link-placeholder-text">Choose product…</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
