import "./HeaderTabs.css";

interface Props {
  onLogout?: () => void;
}

const tabs = [{ id: "stores", label: "Stores" }];

export default function HeaderTabs({ onLogout }: Props) {
  return (
    <header className="header-tabs" aria-label="Primary navigation">
      <nav className="header-tabs__nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className="header-tabs__tab header-tabs__tab--active"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </nav>
      {onLogout && (
        <button
          className="header-tabs__logout"
          onClick={onLogout}
          type="button"
        >
          Sign out
        </button>
      )}
    </header>
  );
}
