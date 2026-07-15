import type { UserRole } from "../../types/auth";
import "./HeaderTabs.css";

export type TabId = "stores" | "reps";

interface Tab {
  id: TabId;
  label: string;
  roles: UserRole[];
}

const TABS: Tab[] = [
  { id: "stores", label: "Stores", roles: ["ADMIN", "MANAGER"] },
  { id: "reps", label: "Reps", roles: ["ADMIN", "MANAGER"] },
];

interface Props {
  activeTab: TabId;
  role?: UserRole;
  onTabChange: (tab: TabId) => void;
  onLogout?: () => void;
}

export default function HeaderTabs({ activeTab, role, onTabChange, onLogout }: Props) {
  const visibleTabs = TABS.filter((t) => !role || t.roles.includes(role));

  return (
    <header className="header-tabs" aria-label="Primary navigation">
      <nav className="header-tabs__nav">
        {visibleTabs.map((tab) => (
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
      {onLogout && (
        <button className="header-tabs__logout" onClick={onLogout} type="button">
          Sign out
        </button>
      )}
    </header>
  );
}
