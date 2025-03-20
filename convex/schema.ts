import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { profileTables } from "./profiles";

const schema = defineSchema({
  ...profileTables,
  files: defineTable({
    storageId: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    uploadedAt: v.string(),
  }),
});

export default schema;
