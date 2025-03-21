import { v } from "convex/values";
import { mutation, query } from "../_generated/server";


// Connect LinkedIn profile data to user profile
export const linkProfileToUser = mutation({
  args: {
    userId: v.id("users"),
    profileId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    const { userId, profileId } = args;
    
    // Update the user record with the profile ID
    await ctx.db.patch(userId, {
      profileId,
    });
    
    // Update the profile with the user ID if needed
    const profile = await ctx.db.get(profileId);
    if (profile) {
      await ctx.db.patch(profileId, {
        userId: userId.toString(),
      });
    }
    
    return { success: true };
  },
});

// Get LinkedIn profile data for a profile
export const getLinkedInData = query({
  args: {
    profileId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    const { profileId } = args;
    
    // Get the profile
    const profile = await ctx.db.get(profileId);
    if (!profile) {
      return null;
    }
    
    // Find the connected user
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("profileId"), profileId))
      .first();
    
    if (!user) {
      return null;
    }
    
    // Return LinkedIn-specific data
    return {
      linkedInId: user.linkedInId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profilePictureUrl: user.profilePictureUrl,
    };
  },
});