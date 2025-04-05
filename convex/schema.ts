import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { profileTables } from "./profiles";
import { jobTables } from "./jobs";
import { resumeTables } from "./resume/schema";
const schema = defineSchema({
  ...profileTables,
  files: defineTable({
    storageId: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    userId: v.optional(v.string()),
    uploadedAt: v.string(),
  }).index("by_userId", ["userId"]),

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
  
  chats: defineTable({
    userId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
    lastMessageAt: v.optional(v.string()),
    messageCount: v.number(),
  }).index("by_userId", ["userId"]),
  
  messages: defineTable({
    chatId: v.id("chats"),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    createdAt: v.string(),
  })
    .index("by_chat_id", ["chatId"])
    .index("by_chat_id_and_created_at", ["chatId", "createdAt"]),
  ...jobTables,
  ...resumeTables,
});

export default schema;
