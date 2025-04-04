import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ConvexError } from "convex/values";

// Get all chats for a user
export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chats")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get a single chat by ID
export const getById = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new ConvexError({
        code: 404,
        message: "Chat not found",
      });
    }
    return chat;
  },
});

// Create a new chat
export const create = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    const chatId = await ctx.db.insert("chats", {
      userId: args.userId,
      title: args.title,
      description: args.description,
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
      messageCount: 0,
    });
    
    return chatId;
  },
});

// Update a chat
export const update = mutation({
  args: {
    chatId: v.id("chats"),
    userId: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { chatId, userId, ...updates } = args;
    
    // Check if chat exists and belongs to user
    const chat = await ctx.db.get(chatId);
    if (!chat) {
      throw new ConvexError({
        code: 404,
        message: "Chat not found",
      });
    }
    
    if (chat.userId !== userId) {
      throw new ConvexError({
        code: 403,
        message: "You don't have permission to update this chat",
      });
    }
    
    // Update the chat
    await ctx.db.patch(chatId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    
    return chatId;
  },
});

// Delete a chat
export const remove = mutation({
  args: {
    chatId: v.id("chats"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if chat exists and belongs to user
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new ConvexError({
        code: 404,
        message: "Chat not found",
      });
    }
    
    if (chat.userId !== args.userId) {
      throw new ConvexError({
        code: 403,
        message: "You don't have permission to delete this chat",
      });
    }
    
    // Find and delete all messages in the chat
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
      .collect();
    
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
    
    // Delete the chat
    await ctx.db.delete(args.chatId);
    
    return true;
  },
});

// Update message count and last message time
export const updateChatStats = mutation({
  args: {
    chatId: v.id("chats"),
    incrementCount: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new ConvexError({
        code: 404,
        message: "Chat not found",
      });
    }
    
    const now = new Date().toISOString();
    const updates: any = {
      updatedAt: now,
      lastMessageAt: now,
    };
    
    if (args.incrementCount) {
      updates.messageCount = chat.messageCount + 1;
    }
    
    await ctx.db.patch(args.chatId, updates);
  },
});