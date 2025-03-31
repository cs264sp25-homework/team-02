import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { profileTables } from "./profiles";
import { jobTables } from "./jobs";

const schema = defineSchema({
  ...profileTables,
  files: defineTable({
    storageId: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    uploadedAt: v.string(),
  }),

  users: defineTable({
    linkedInId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    email: v.optional(v.string()),
    profilePictureUrl: v.optional(v.string()),
    locale: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    expiresAt: v.string(),
    createdAt: v.string(),
    lastLoginAt: v.string(),
    profileId: v.optional(v.id("profiles")),
  }).index("by_linkedInId", ["linkedInId"]),
  ...jobTables,
});

export default schema;
