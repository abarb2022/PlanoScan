import type { UserRole } from "../../types/auth";
import ManagerStores from "./ManagerStores";
import RepStores from "./RepStores";
import "./Stores.css";

interface StoresProps {
    userRole?: UserRole;
    companyId?: string | null;
}

export default function Stores({ userRole, companyId }: StoresProps) {
    if (userRole === "REP") {
        return <RepStores />;
    }

    return <ManagerStores companyId={companyId} />;
}
