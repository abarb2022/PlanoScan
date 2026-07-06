import type { UserRole } from "../../types/auth";
import ManagerStores from "./ManagerStores";
import RepStores from "./RepStores";
import "./Stores.css";

interface StoresProps {
  userRole?: UserRole;
}

export default function Stores({ userRole }: StoresProps) {
  if (userRole === "REP") {
    return <RepStores />;
  }

  return <ManagerStores />;
}
