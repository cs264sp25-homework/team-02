import { ConvexError, v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";

// Get messages for a chat
export const getAll = query({
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
export const create = mutation({
  args: {
    chatId: v.id("chats"),
    content: v.string(),
    userId: v.optional(v.string()),
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
    
    return { userMessageId: messageId, aiMessageId };
  },
});

// Update a message content
export const update = mutation({
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

// Function to create a message and generate AI response
export const createAndGenerateResponse = mutation({
  args: {
    chatId: v.id("chats"),
    content: v.string(),
    userId: v.string(),
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
    
    // Check if this chat belongs to the user
    if (chat.userId !== args.userId) {
      throw new ConvexError({
        code: 403,
        message: "You don't have permission to post in this chat",
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
    
    // Check if this is the first message in the chat
    const isFirstMessage = chat.messageCount === 0;
    
    // Update chat stats for user message
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
    
    // Update chat stats for AI message
    await ctx.db.patch(args.chatId, {
      messageCount: chat.messageCount + 2, // Add 2 for both messages
    });
    
    // Schedule the AI response generation
    await ctx.scheduler.runAfter(0, api.messages.generateAiResponse, {
      chatId: args.chatId,
      userId: args.userId,
      aiMessageId,
      isFirstMessage,
    });
    
    return { messageId, aiMessageId };
  },
});

// Function to generate AI response (scheduled by createAndGenerateResponse)
export const generateAiResponse = action({
  args: {
    chatId: v.id("chats"),
    userId: v.string(),
    aiMessageId: v.id("messages"),
    isFirstMessage: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Add debugging at start of function
    console.log("🔍 generateAiResponse STARTED", {
      chatId: args.chatId.toString(),
      userId: args.userId,
      aiMessageId: args.aiMessageId.toString(),
      isFirstMessage: args.isFirstMessage
    });
    
    try {
      // Get the chat to verify it exists
      const chat = await ctx.runQuery(api.chat.getById, {
        chatId: args.chatId,
      });
      
      console.log("🔍 Chat retrieved:", chat ? "Found" : "Not found");
      
      if (!chat) {
        throw new Error("Chat not found");
      }
      
      // Get the message history to get the latest user message
      const messages = await ctx.runQuery(api.messages.getAll, {
        chatId: args.chatId,
        limit: 11, // Get enough to include the placeholder and the latest user message
      });
      
      console.log("🔍 Retrieved message history, count:", messages?.length || 0);
      
      // The user message should be the second-to-last message (last one is our placeholder)
      const userMessages = messages.filter(msg => msg.role === "user");
      const latestUserMessage = userMessages[userMessages.length - 1]?.content;
      
      console.log("🔍 Latest user message:", latestUserMessage ? `"${latestUserMessage.substring(0, 50)}${latestUserMessage.length > 50 ? '...' : ''}"` : "Not found");
      
      if (!latestUserMessage) {
        throw new Error("No user message found to respond to");
      }
      
      // Log before calling OpenAI
      console.log("🔍 About to call handleChatMessage with:", {
        chatId: args.chatId.toString(),
        userId: args.userId,
        messageLength: latestUserMessage.length,
        isFirstMessage: args.isFirstMessage
      });
      
      // Generate AI response
      const aiResponse = await ctx.runAction(api.openai.handleChatMessage, {
        chatId: args.chatId,
        userId: args.userId,
        message: latestUserMessage,
        isFirstMessage: args.isFirstMessage,
      });
      
      // Log the response
      console.log("🔍 OpenAI response received:", aiResponse ? `"${aiResponse.substring(0, 50)}${aiResponse.length > 50 ? '...' : ''}"` : "null or empty");
      
      // Update the placeholder message with the actual response
      console.log("🔍 About to update message with ID:", args.aiMessageId.toString());
      
      await ctx.runMutation(api.messages.update, {
        messageId: args.aiMessageId,
        content: aiResponse || "Sorry, I couldn't generate a response at this time."
      });
      
      console.log("🔍 Message updated successfully");
      
      return true;
    } catch (error) {
      console.error("❌ Error in generateAiResponse:", error);
      
      // Update the placeholder with an error message directly
      try {
        await ctx.runMutation(api.messages.update, {
          messageId: args.aiMessageId,
          content: "I'm sorry, I encountered an error while processing your request. Please try again."
        });
        console.log("🔍 Error message updated");
      } catch (patchError) {
        console.error("❌ Failed to update error message:", patchError);
      }
      
      return false;
    }
  },
});

// Get a specific message by ID
export const getMessageById = query({
  args: {
    messageId: v.id("messages")
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.messageId);
  }
});