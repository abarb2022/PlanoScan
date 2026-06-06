import "./HeaderTabs.css";

const tabs = [
  {
    id: "stores",
    label: "Stores",
  },
];

export default function HeaderTabs() {
  return (
    <header className="header-tabs" aria-label="Primary navigation">
      <nav className="header-tabs__nav">
        {tabs.map((tab) => (
          <button key={tab.id} className="header-tabs__tab header-tabs__tab--active" type="button">
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
