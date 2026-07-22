import { useEffect, useState } from "react";
import { AuthPage } from "./components/auth/AuthPage";
import ChangePasswordModal from "./components/auth/ChangePasswordModal";
import HeaderTabs, { type TabId } from "./components/header/HeaderTabs";
import Companies from "./components/company/Companies";
import Managers from "./components/manager/Managers";
import Products from "./components/product/Products";
import Planograms from "./components/planogram/Planograms";
import Reps from "./components/rep/Reps";
import Submissions from "./components/submission/Submissions";
import FlaggedReviews from "./components/review/FlaggedReviews";
import Stores from "./components/store/Stores";
import { useAuth } from "./hooks/useAuth";
import { getCompanies } from "./services/companyService";
import type { Company } from "./types/manager";
import type { RepViewTab } from "./types/store";

function App() {
  const {
    user,
    login,
    logout,
    changePassword,
    mustChangePassword,
    error,
    isSubmitting,
  } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("stores");
  const [repAssignmentTab, setRepAssignmentTab] =
    useState<RepViewTab>("active");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setActiveTab("stores");
    setRepAssignmentTab("active");
    setSelectedCompanyId(null);
    if (user?.role === "ADMIN") {
      getCompanies()
        .then(setCompanies)
        .catch(() => setCompanies([]));
    } else {
      setCompanies([]);
    }
  }, [user]);

  if (!user) {
    return (
      <AuthPage onLogin={login} error={error} isSubmitting={isSubmitting} />
    );
  }

  if (mustChangePassword) {
    return <ChangePasswordModal onSave={changePassword} onLogout={logout} />;
  }

  return (
    <div className="app-shell">
      <HeaderTabs
        activeTab={activeTab}
        role={user.role}
        email={user.email}
        companyName={user.companyName}
        onTabChange={setActiveTab}
        repAssignmentTab={repAssignmentTab}
        onRepAssignmentTabChange={setRepAssignmentTab}
        onLogout={logout}
        companies={companies}
        selectedCompanyId={selectedCompanyId}
        onCompanyChange={setSelectedCompanyId}
      />
      {activeTab === "stores" && (
        <Stores
          userRole={user.role}
          companyId={selectedCompanyId}
          repAssignmentTab={repAssignmentTab}
        />
      )}
      {activeTab === "reps" && <Reps companyId={selectedCompanyId} />}
      {activeTab === "managers" && <Managers companyId={selectedCompanyId} />}
      {activeTab === "companies" && <Companies />}
      {activeTab === "products" && <Products companyId={selectedCompanyId} />}
      {activeTab === "planograms" && <Planograms role={user.role} />}
      {activeTab === "submissions" && <Submissions companyId={selectedCompanyId} />}
      {activeTab === "reviews" && <FlaggedReviews companyId={selectedCompanyId} />}
    </div>
  );
}

export default App;
