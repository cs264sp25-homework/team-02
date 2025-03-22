import { useStore } from '@nanostores/react';
import { $user, $isAuthenticated, $isLoading, initAuth, storeUserData, logout } from '../stores/auth-store';

export function useAuth() {
  const user = useStore($user);
  const isAuthenticated = useStore($isAuthenticated);
  const isLoading = useStore($isLoading);

  return {
    user,
    isAuthenticated,
    isLoading,
    initAuth,
    storeUserData,
    logout
  };
}