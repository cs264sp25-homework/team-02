import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { ConvexError } from "convex/values";
import { api } from "./_generated/api";

// Get messages for a chat
export const getByChatId = query({
  args: {
    chatId: v.id("chats"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if chat exists
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new ConvexError({
        code: 404,
        message: "Chat not found",
      });
    }
    
    // Get messages, sorted by creation time
    const limit = args.limit || 50; // Default to 50 messages
    return await ctx.db
      .query("messages")
      .withIndex("by_chat_id_and_created_at", (q) =>
        q.eq("chatId", args.chatId)
      )
      .order("asc")
      .take(limit);
  },
});

// Create a new user message
export const createUserMessage = mutation({
  args: {
    chatId: v.id("chats"),
    content: v.string(),
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
        message: "You don't have permission to message in this chat",
      });
    }
    
    const now = new Date().toISOString();
    
    // Create the user message
    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      content: args.content,
      role: "user",
      createdAt: now,
    });
    
    // Update chat stats
    await ctx.db.patch(args.chatId, {
      updatedAt: now,
      lastMessageAt: now,
      messageCount: chat.messageCount + 1,
    });
    
    // Create a placeholder for AI response
    const aiMessageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      content: "Thinking...",
      role: "assistant",
      createdAt: new Date(Date.now() + 1).toISOString(), // Just after user message
    });
    
    // Update chat stats again
    await ctx.db.patch(args.chatId, {
      messageCount: chat.messageCount + 2, // Add 2 for both messages
    });
    
    // Get all previous messages for context (limit to recent 10 for performance)
    const previousMessages = await ctx.db
      .query("messages")
      .withIndex("by_chat_id_and_created_at", (q) =>
        q.eq("chatId", args.chatId)
      )
      .order("desc")
      .take(11); // Include our new message + 10 previous ones
    
    // // Format messages for the AI
    // const messageHistory = previousMessages
    //   .reverse() // Get in chronological order
    //   .filter(m => m._id !== aiMessageId) // Exclude placeholder
    //   .map(m => ({
    //     role: m.role,
    //     content: m.content,
    //   }));
    
    // // Schedule AI response generation
    // ctx.scheduler.runAfter(0, api.openai.generateChatResponse, {
    //   messageHistory,
    //   responseMessageId: aiMessageId,
    // });
    
    // return { userMessageId: messageId, aiMessageId };
  },
});

// Internal mutation to update AI message
export const updateAiMessage = internalMutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if message exists
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new ConvexError({
        code: 404,
        message: "Message not found",
      });
    }
    
    // Update the message
    await ctx.db.patch(args.messageId, {
      content: args.content,
    });
    
    return true;
  },
});

// Delete a message
export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if message exists
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new ConvexError({
        code: 404,
        message: "Message not found",
      });
    }
    
    // Check if user owns the chat
    const chat = await ctx.db.get(message.chatId);
    if (!chat || chat.userId !== args.userId) {
      throw new ConvexError({
        code: 403,
        message: "You don't have permission to delete this message",
      });
    }
    
    // Delete the message
    await ctx.db.delete(args.messageId);
    
    // Update chat stats
    await ctx.db.patch(message.chatId, {
      messageCount: Math.max(0, chat.messageCount - 1),
    });
    
    return true;
  },
});