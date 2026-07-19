import { useEffect, useRef, useState } from "react";
import type { Company } from "../../types/manager";
import type { UserRole } from "../../types/auth";
import type { RepViewTab } from "../../types/store";
import CompanySelect from "./CompanySelect";
import "./HeaderTabs.css";

export type TabId = "stores" | "reps" | "managers" | "companies" | "products" | "planograms" | "reviews";

interface Tab {
  id: TabId;
  label: string;
  roles: UserRole[];
}

const TABS: Tab[] = [
  { id: "stores", label: "Stores", roles: ["ADMIN", "MANAGER", "REP"] },
  { id: "reps", label: "Reps", roles: ["ADMIN", "MANAGER"] },
  { id: "managers", label: "Managers", roles: ["ADMIN"] },
  { id: "companies", label: "Companies", roles: ["ADMIN"] },
  { id: "products", label: "Products", roles: ["ADMIN", "MANAGER"] },
  { id: "planograms", label: "Planograms", roles: ["ADMIN", "MANAGER"] },
  { id: "reviews", label: "Reviews", roles: ["ADMIN", "MANAGER"] },
];

const REP_TABS: { id: RepViewTab; label: string }[] = [
  { id: "active", label: "Today's assignments" },
  { id: "history", label: "History" },
  { id: "calendar", label: "Calendar" },
];

const ROLE_LABELS: Record<UserRole, string> = {
  REP: "Sales Rep",
  MANAGER: "Manager",
  ADMIN: "Administrator",
};

function UserAvatar({ email, role, companyName }: { email?: string; role?: UserRole; companyName?: string | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const initial = email ? email[0].toUpperCase() : "?";

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="user-avatar-wrap" ref={ref}>
      <button
        className="user-avatar-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Profile"
        type="button"
      >
        {initial}
      </button>
      {open && (
        <div className="user-profile-card">
          <div className="user-profile-avatar">{initial}</div>
          <div className="user-profile-info">
            <span className="user-profile-email">{email}</span>
            {role && (
              <span className="user-profile-role">{ROLE_LABELS[role]}</span>
            )}
            {companyName && (
              <span className="user-profile-company">{companyName}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  activeTab: TabId;
  role?: UserRole;
  email?: string;
  companyName?: string | null;
  onTabChange: (tab: TabId) => void;
  repAssignmentTab?: RepViewTab;
  onRepAssignmentTabChange?: (tab: RepViewTab) => void;
  onLogout?: () => void;
  companies?: Company[];
  selectedCompanyId?: string | null;
  onCompanyChange?: (id: string | null) => void;
}

export default function HeaderTabs({
  activeTab,
  role,
  email,
  companyName,
  onTabChange,
  repAssignmentTab,
  onRepAssignmentTabChange,
  onLogout,
  companies,
  selectedCompanyId,
  onCompanyChange,
}: Props) {
  const visibleTabs = TABS.filter((t) => !role || t.roles.includes(role));
  const showCompanyFilter =
    role === "ADMIN" && companies && companies.length > 0;

  return (
    <header className="header-tabs" aria-label="Primary navigation">
      <nav className="header-tabs__nav">
        {role === "REP"
          ? REP_TABS.map((tab) => (
              <button
                key={tab.id}
                className={`header-tabs__tab${repAssignmentTab === tab.id ? " header-tabs__tab--active" : ""}`}
                type="button"
                onClick={() => onRepAssignmentTabChange?.(tab.id)}
              >
                {tab.label}
              </button>
            ))
          : visibleTabs.map((tab) => (
              <button
                key={tab.id}
                className={`header-tabs__tab${activeTab === tab.id ? " header-tabs__tab--active" : ""}`}
                type="button"
                onClick={() => onTabChange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
      </nav>

      <div className="header-tabs__right">
        {showCompanyFilter && (
          <CompanySelect
            companies={companies!}
            value={selectedCompanyId ?? null}
            onChange={(id) => onCompanyChange?.(id)}
          />
        )}
        <UserAvatar email={email} role={role} companyName={companyName} />
        {onLogout && (
          <button
            className="header-tabs__logout"
            onClick={onLogout}
            type="button"
          >
            Sign out
          </button>
        )}
      </div>
    </header>
  );
}
