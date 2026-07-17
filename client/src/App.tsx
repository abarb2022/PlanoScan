import { useEffect, useState } from "react";
import { AuthPage } from "./components/auth/AuthPage";
import ChangePasswordModal from "./components/auth/ChangePasswordModal";
import HeaderTabs, { type TabId } from "./components/header/HeaderTabs";
import Reps from "./components/rep/Reps";
import Stores from "./components/store/Stores";
import { useAuth } from "./hooks/useAuth";

function App() {
  const { user, login, logout, changePassword, mustChangePassword, error, isSubmitting } =
    useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("stores");

  useEffect(() => {
    setActiveTab("stores");
  }, [user]);

  if (!user) {
    return <AuthPage onLogin={login} error={error} isSubmitting={isSubmitting} />;
  }

  if (mustChangePassword) {
    return (
      <ChangePasswordModal
        onSave={changePassword}
        onLogout={logout}
      />
    );
  }

  return (
    <div className="app-shell">
      <HeaderTabs
        activeTab={activeTab}
        role={user.role}
        onTabChange={setActiveTab}
        onLogout={logout}
      />
      {activeTab === "stores" && <Stores userRole={user.role}/>}
      {activeTab === "reps" && <Reps />}
    </div>
  );
}

export default App;
