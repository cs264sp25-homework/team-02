import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Generate a URL for file upload
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Save file metadata after upload
export const saveFile = mutation({
  args: {
    storageId: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { storageId, fileName, fileType, fileSize, userId } = args;

    // Get user from auth if not provided
    let fileUserId = userId;
    if (!fileUserId) {
      const identity = await ctx.auth.getUserIdentity();
      if (identity) {
        fileUserId = identity.subject;
      }
    }

    await ctx.db.insert("files", {
      storageId,
      fileName,
      fileType,
      fileSize,
      userId: fileUserId,
      uploadedAt: new Date().toISOString(),
    });
  },
});
