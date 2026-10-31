"use client";

import { useNavigationGuard } from "./NavigationGuard";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/logout";
import { LogoutConfirmationModal } from "@/components/auth/LogoutConfirmationModal";

export function LogoutButton() {
  const navigation = useNavigationGuard();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    await logoutAction();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => navigation.request(() => setShowLogoutModal(true))}
        className="autocare-button w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-out text-muted hover:bg-accentSoft hover:text-accent"
      >
        <LogOut className="h-5 w-5 flex-shrink-0" />
        <span className="font-medium">Logout</span>
      </button>

      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}
