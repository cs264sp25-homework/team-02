import { ConvexError, v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

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
    
    // Update chat stats for user message
    await ctx.db.patch(args.chatId, {
      updatedAt: now,
      lastMessageAt: now,
      messageCount: chat.messageCount + 1,
    });
    
    // Create assistant message (empty initially)
    const aiMessageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      content: "", // Empty content initially
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
      isFirstMessage: chat.messageCount === 0,
    });
    
    return { messageId, aiMessageId };
  },
});

const getMessageHistory = async (
  ctx: any, 
  chatId: Id<"chats">, 
  limit = 10
) => {
  const messages = await ctx.runQuery(api.messages.getAll, {
    chatId,
    limit,
  });
  
  return messages || [];
};

// Function to generate AI response (scheduled by createAndGenerateResponse)
export const generateAiResponse = action({
  args: {
    chatId: v.id("chats"),
    userId: v.string(),
    aiMessageId: v.id("messages"),
    isFirstMessage: v.boolean(),
  },
  handler: async (ctx, args) => {
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
      
      if (!chat) {
        throw new Error("Chat not found");
      }
      
      // Get message history
      const messages = await getMessageHistory(ctx, args.chatId);
      
      // Get the latest user message
      const userMessages = messages.filter((msg: { role: string; }) => msg.role === "user");
      const latestUserMessage = userMessages[userMessages.length - 1]?.content;
      
      if (!latestUserMessage) {
        throw new Error("No user message found to respond to");
      }
      
      // Generate AI response
      const aiResponse = await ctx.runAction(api.openai.handleChatMessage, {
        chatId: args.chatId,
        userId: args.userId,
        message: latestUserMessage,
        isFirstMessage: args.isFirstMessage,
      });
      
      // Initialize with empty content
      await ctx.runMutation(api.messages.update, {
        messageId: args.aiMessageId,
        content: ""
      });
      
      // Stream the response in chunks
      const chunkSize = 20; // Characters per update
      let currentPos = 0;
      
      while (currentPos < aiResponse.length) {
        const endPos = Math.min(currentPos + chunkSize, aiResponse.length);
        const chunk = aiResponse.substring(0, endPos);  // Send accumulated content
        
        await ctx.runMutation(api.messages.update, {
          messageId: args.aiMessageId,
          content: chunk
        });
        
        currentPos = endPos;
        
        // Add a small delay between updates to simulate typing
        if (currentPos < aiResponse.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      return true;
    } catch (error) {
      console.error("❌ Error in generateAiResponse:", error);
      
      // Update the message with an error message
      try {
        await ctx.runMutation(api.messages.update, {
          messageId: args.aiMessageId,
          content: "I'm sorry, I encountered an error while processing your request. Please try again."
        });
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