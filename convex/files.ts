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
  },
  handler: async (ctx, args) => {
    const { storageId, fileName, fileType, fileSize } = args;

    await ctx.db.insert("files", {
      storageId,
      fileName,
      fileType,
      fileSize,
      uploadedAt: new Date().toISOString(),
    });
  },
});
