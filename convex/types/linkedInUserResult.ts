import { Id } from "../_generated/dataModel";

export interface LinkedInUserResult {
  userId: Id<"users">;
  isNewUser: boolean;
  firstName: string;
  lastName: string;
  linkedInId: string;
  email?: string;
  profilePictureUrl?: string;
  locale?: string;
  accessToken: string;
  expiresAt: string;
}