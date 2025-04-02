import { useStore } from "@nanostores/react";
import { storeUserData, logout, $authStore } from "../stores/auth-store";

export function useAuth() {
  const { user, isAuthenticated, isLoading } = useStore($authStore);

  return {
    user,
    isAuthenticated,
    isLoading,
    storeUserData,
    logout,
  };
}
