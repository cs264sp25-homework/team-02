import { v } from "convex/values";
import { action, mutation, query } from "../_generated/server";
import { ConvexError } from "convex/values";
import { Id } from "../_generated/dataModel";
import { LinkedInUserResult } from "../types/linkedInUserResult";

// LinkedIn OAuth Configuration with OpenID Connect
export const LINKEDIN_CONFIG = {
  clientId: process.env.LINKEDIN_CLIENT_ID || "",
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "",
  redirectUri: process.env.LINKEDIN_REDIRECT_URI || "http://localhost:5173/auth/callback",
  scopes: ["openid", "profile", "email"],
};

// Exchange the authorization code for an access token using OpenID Connect
export const exchangeLinkedInCode = action({
  args: {
    code: v.string(),
  },
  handler: async (_ctx, args): Promise<LinkedInUserResult> => {
    const { code } = args;
    
    try {
      // Exchange code for token
      const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: LINKEDIN_CONFIG.clientId,
          client_secret: LINKEDIN_CONFIG.clientSecret,
          redirect_uri: LINKEDIN_CONFIG.redirectUri,
        }),
      });
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("LinkedIn token error:", errorText);
        throw new ConvexError({
          code: "AUTH_ERROR",
          message: `Failed to exchange LinkedIn code for token: ${errorText}`,
        });
      }
      
      const tokenData = await tokenResponse.json();      
      // Get the user's profile information using the userinfo endpoint
      const userInfoResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });
      
      
      if (!userInfoResponse.ok) {
        const errorText = await userInfoResponse.text();
        console.error("LinkedIn userinfo error:", errorText);
        throw new ConvexError({
          code: "API_ERROR",
          message: `Failed to fetch LinkedIn profile: ${errorText}`,
        });
      }
      
      const userInfo = await userInfoResponse.json();
    
      
      // Since we're in an action and can't run mutations, we return the user info directly
      return {
        userId: "temp_id" as Id<"users">,  // This is a placeholder
        isNewUser: true,
        linkedInId: userInfo.sub,
        firstName: userInfo.given_name || "Unknown",
        lastName: userInfo.family_name || "User",
        email: userInfo.email,
        profilePictureUrl: userInfo.picture,
        locale: userInfo.locale,
        accessToken: tokenData.access_token,
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      };
    } catch (error) {
      console.error("LinkedIn auth action error:", error);
      throw error;
    }
  },
});

export const storeLinkedInUser = mutation({
  args: {
    linkedInId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    email: v.optional(v.string()),
    profilePictureUrl: v.optional(v.string()),
    locale: v.optional(v.union(v.string(), v.object({
      country: v.string(),
      language: v.string()
    }))),
    accessToken: v.string(),
    expiresAt: v.string(),
  },
  handler: async (ctx, userData): Promise<LinkedInUserResult> => {
    // Convert locale to string if it's an object
    const localeString = typeof userData.locale === 'string' 
      ? userData.locale 
      : userData.locale 
        ? `${userData.locale.language}_${userData.locale.country}`
        : undefined;
    
    // Find existing user with this LinkedIn ID
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_linkedInId", (q) => q.eq("linkedInId", userData.linkedInId))
      .first();
    
    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        profilePictureUrl: userData.profilePictureUrl,
        locale: localeString,
        accessToken: userData.accessToken,
        expiresAt: userData.expiresAt,
        lastLoginAt: new Date().toISOString(),
      });
      
      return { 
        userId: existingUser._id, 
        isNewUser: false,
        firstName: userData.firstName,
        lastName: userData.lastName,
        linkedInId: userData.linkedInId,
        email: userData.email,
        profilePictureUrl: userData.profilePictureUrl,
        locale: localeString,
        accessToken: userData.accessToken,
        expiresAt: userData.expiresAt
      };
    } else {
      // Create new user
      const userId = await ctx.db.insert("users", {
        linkedInId: userData.linkedInId,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        profilePictureUrl: userData.profilePictureUrl,
        locale: localeString,
        accessToken: userData.accessToken,
        expiresAt: userData.expiresAt,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      });
      
      return { 
        userId, 
        isNewUser: true,
        firstName: userData.firstName,
        lastName: userData.lastName,
        linkedInId: userData.linkedInId,
        email: userData.email,
        profilePictureUrl: userData.profilePictureUrl,
        locale: localeString,
        accessToken: userData.accessToken,
        expiresAt: userData.expiresAt
      };
    }
  },
});

// Get current user info
export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      return null;
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_linkedInId", (q) => q.eq("linkedInId", identity.subject))
      .first();
    
    return user;
  },
});

// Check if user is already connected to a LinkedIn account
export const isConnectedToLinkedIn = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      return false;
    }
    
    // For simplicity, we'll consider the user connected if they exist in our users table
    const user = await ctx.db
      .query("users")
      .withIndex("by_linkedInId", (q) => q.eq("linkedInId", identity.subject))
      .first();
    
    return !!user;
  },
});