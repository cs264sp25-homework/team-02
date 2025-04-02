import { api } from "../../../convex/_generated/api";
import { convex } from "@/lib/convex";
import { persistentAtom } from "@nanostores/persistent";

// Define the user type
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  profilePictureUrl?: string;
}

export const $authStore = persistentAtom<{
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}>(
  "auth",
  {
    isAuthenticated: false,
    user: null,
    isLoading: true,
  },
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  },
);

// Store user data
export async function storeUserData(userData: any) {
  try {
    const result = await convex.mutation(api.linkedin.auth.storeLinkedInUser, {
      linkedInId: userData.linkedInId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      profilePictureUrl: userData.profilePictureUrl,
      locale: userData.locale,
      accessToken: userData.accessToken,
      expiresAt: userData.expiresAt,
    });

    if (result) {
      $authStore.set({
        isAuthenticated: true,
        user: {
          id: result.userId,
          firstName: result.firstName,
          lastName: result.lastName,
          email: userData.email,
          profilePictureUrl: userData.profilePictureUrl,
        },
        isLoading: false,
      });
      return result;
    }
    return null;
  } catch (error) {
    console.error("Failed to store user:", error);
    throw error;
  }
}

// Logout
export function logout() {
  $authStore.set({
    isAuthenticated: false,
    user: null,
    isLoading: false,
  });
}
