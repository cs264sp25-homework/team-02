import { atom } from "nanostores";
import { api } from "../../../convex/_generated/api";
import { convex } from "@/lib/convex";

// Define the user type
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  profilePictureUrl?: string;
}

// Create atoms for auth state
export const $isAuthenticated = atom<boolean>(false);
export const $user = atom<User | null>(null);
export const $isLoading = atom<boolean>(true);

// Initialize auth state
export async function initAuth() {
  $isLoading.set(true);
  try {
    const currentUser = await convex.query(api.linkedin.auth.getCurrentUser);
    if (currentUser) {
      $user.set({
        id: currentUser._id,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email,
        profilePictureUrl: currentUser.profilePictureUrl,
      });
      $isAuthenticated.set(true);
    } else {
      $isAuthenticated.set(false);
      $user.set(null);
    }
  } catch (error) {
    console.error("Failed to initialize auth:", error);
    $isAuthenticated.set(false);
    $user.set(null);
  } finally {
    $isLoading.set(false);
  }
}

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
      $user.set({
        id: result.userId,
        firstName: result.firstName,
        lastName: result.lastName,
        email: userData.email,
        profilePictureUrl: userData.profilePictureUrl,
      });
      $isAuthenticated.set(true);
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
  $isAuthenticated.set(false);
  $user.set(null);
  // Add any additional logout logic here
}
