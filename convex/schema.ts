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
  ...jobTables,
});

export default schema;
