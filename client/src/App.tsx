import { useAuth } from "./hooks/useAuth";
import { AuthPage } from "./components/auth/AuthPage";
import HeaderTabs from "./components/header/HeaderTabs";
import Stores from "./components/store/Stores";

function App() {
  const { user, login, logout, error, isSubmitting } = useAuth();

  if (!user) {
    return (
      <AuthPage onLogin={login} error={error} isSubmitting={isSubmitting} />
    );
  }

  return (
    <div className="app-shell">
      <HeaderTabs onLogout={logout} />
      <Stores />
    </div>
  );
}

export default App;
