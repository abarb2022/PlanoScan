import type { UserRole } from "../../types/auth";
import type { RepViewTab } from "../../types/store";
import ManagerStores from "./ManagerStores";
import RepStores from "./RepStores";
import "./Stores.css";

interface StoresProps {
  userRole?: UserRole;
  companyId?: string | null;
  repAssignmentTab: RepViewTab;
}

export default function Stores({
  userRole,
  companyId,
  repAssignmentTab,
}: StoresProps) {
  if (userRole === "REP") {
    return <RepStores activeTab={repAssignmentTab} />;
  }

  return <ManagerStores companyId={companyId} />;
}
