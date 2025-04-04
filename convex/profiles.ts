import { Infer, v } from "convex/values";
import { defineTable } from "convex/server";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { z } from "zod";
/******************************************************************************
 * SCHEMA
 *
 * Defines types and database schema for profiles:
 * - ProfileInType: Fields that can be provided when creating/updating
 * - ProfileUpdateType: Fields that can be updated
 * - ProfileType: Complete profile document type including system fields
 * Includes database indexes for efficient querying (by_user_id)
 ******************************************************************************/

/**
 * Type representing the fields that can be provided when creating a profile
 */
export const profileInSchema = {
  // Basic Information
  name: v.string(),
  email: v.string(),
  phone: v.optional(v.string()),
  location: v.optional(v.string()),
  profilePictureUrl: v.optional(v.string()),

  // Social Links
  socialLinks: v.optional(
    v.array(
      v.object({
        platform: v.string(),
        url: v.string(),
      }),
    ),
  ),

  // Education
  education: v.array(
    v.object({
      institution: v.string(),
      degree: v.string(),
      field: v.string(),
      startDate: v.string(),
      endDate: v.optional(v.string()),
      gpa: v.optional(v.number()),
      description: v.optional(v.string()),
      location: v.optional(v.string()),
    }),
  ),

  // Work Experience
  workExperience: v.array(
    v.object({
      company: v.string(),
      position: v.string(),
      location: v.optional(v.string()),
      startDate: v.string(),
      endDate: v.optional(v.string()),
      current: v.boolean(),
      description: v.array(v.string()),
      technologies: v.optional(v.array(v.string())),
    }),
  ),

  // Project Experience
  projects: v.array(
    v.object({
      name: v.string(),
      description: v.array(v.string()),
      startDate: v.optional(v.string()),
      endDate: v.optional(v.string()),
      technologies: v.array(v.string()),
      link: v.optional(v.string()),
      githubUrl: v.optional(v.string()),
      highlights: v.optional(v.array(v.string())),
    }),
  ),

  // Skills
  skills: v.array(v.string()),
};

export const zodProfileInSchema = z.object({
  name: z.string().describe("Full name of the candidate"),
  email: z.string().describe("Email address of the candidate"),
  phone: z.string().optional().describe("Phone number of the candidate"),
  location: z
    .string()
    .optional()
    .describe("Location or address of the candidate"),
  socialLinks: z
    .array(
      z.object({
        platform: z
          .string()
          .describe("Name of the social platform (e.g., LinkedIn, GitHub)"),
        url: z
          .string()
          .describe("Full URL to the candidate's profile on this platform"),
      }),
    )
    .default([])
    .describe("List of the candidate's social media profiles"),

  education: z
    .array(
      z.object({
        institution: z
          .string()
          .describe("Name of the school, college, or university"),
        degree: z
          .string()
          .describe("Degree obtained (e.g., Bachelor's, Master's)"),
        field: z.string().describe("Field of study or major"),
        startDate: z.string().describe("Start date in YYYY-MM format"),
        endDate: z
          .string()
          .optional()
          .describe(
            "End date in YYYY-MM format. If unknown or unclear, then ignore this field.",
          ),
        gpa: z.number().optional().describe("Grade Point Average if mentioned"),
        description: z
          .string()
          .optional()
          .describe("Additional details about the education"),
        location: z.string().optional().describe("Location of the institution"),
      }),
    )
    .default([])
    .describe("Educational background of the candidate"),

  workExperience: z
    .array(
      z.object({
        company: z.string().describe("Name of the employer or company"),
        position: z.string().describe("Job title or role at the company"),
        location: z
          .string()
          .optional()
          .describe("Location of the job (city, country, or remote)"),
        startDate: z.string().describe("Start date in YYYY-MM format"),
        endDate: z
          .string()
          .optional()
          .describe(
            "End date in YYYY-MM format. If unknown or unclear or present/ongoing, then ignore this field.",
          ),
        current: z
          .boolean()
          .describe("Whether this is the candidate's current position"),
        description: z
          .array(z.string())
          .default([])
          .describe("List of job responsibilities and achievements"),
        technologies: z
          .array(z.string())
          .default([])
          .describe(
            "Technologies or tools used in this role. (e.g. 'Python', 'JavaScript', 'React', 'Node.js', 'SQL', 'Git', 'Docker', 'AWS')",
          ),
      }),
    )
    .default([])
    .describe("Professional work experience of the candidate"),

  projects: z
    .array(
      z.object({
        name: z.string().describe("Name or title of the project"),
        description: z
          .array(z.string())
          .default([])
          .describe("Detailed description of the project"),
        startDate: z
          .string()
          .optional()
          .describe("When the project started in YYYY-MM format"),
        endDate: z
          .string()
          .optional()
          .describe(
            "When the project ended in YYYY-MM format. If the project is ongoing/present, then ignore this field.",
          ),
        technologies: z
          .array(z.string())
          .default([])
          .describe(
            "Technologies, languages, or frameworks used. (e.g. 'Python', 'JavaScript', 'React', 'Node.js', 'SQL', 'Git', 'Docker', 'AWS')",
          ),
        link: z
          .string()
          .optional()
          .describe("URL to the live project if available"),
        githubUrl: z
          .string()
          .optional()
          .describe("URL to the project's GitHub repository"),
        highlights: z
          .array(z.string())
          .default([])
          .describe(
            "Key achievements or notable aspects of the project. (e.g. 'Won hackathon', 'Won award', 'Sold product', 'Raised $100k', 'Published paper', 'Open-sourced code')",
          ),
      }),
    )
    .default([])
    .describe("Projects completed by the candidate"),

  skills: z
    .array(z.string())
    .default([])
    .describe(
      "All relevant skills of the candidate. (e.g. 'Python', 'JavaScript', 'React', 'Node.js', 'SQL', 'Git', 'Docker', 'AWS')",
    ),
});

// eslint-disable-next-line
const profileInSchemaObject = v.object(profileInSchema);
export type ProfileInType = Infer<typeof profileInSchemaObject>;

/**
 * Type representing the fields that can be provided when updating a profile
 */
export const profileUpdateSchema = {
  ...profileInSchema,
  // Make all fields optional for updates
  name: v.optional(v.string()),
  email: v.optional(v.string()),
  education: v.optional(
    v.array(
      v.object({
        institution: v.string(),
        degree: v.string(),
        field: v.string(),
        startDate: v.string(),
        endDate: v.optional(v.string()),
        gpa: v.optional(v.number()),
        description: v.optional(v.string()),
        location: v.optional(v.string()),
      }),
    ),
  ),
  workExperience: v.optional(
    v.array(
      v.object({
        company: v.string(),
        position: v.string(),
        location: v.optional(v.string()),
        startDate: v.string(),
        endDate: v.optional(v.string()),
        current: v.boolean(),
        description: v.array(v.string()),
        technologies: v.optional(v.array(v.string())),
      }),
    ),
  ),
  projects: v.optional(
    v.array(
      v.object({
        name: v.string(),
        description: v.array(v.string()),
        startDate: v.optional(v.string()),
        endDate: v.optional(v.string()),
        technologies: v.array(v.string()),
        link: v.optional(v.string()),
        githubUrl: v.optional(v.string()),
        highlights: v.optional(v.array(v.string())),
      }),
    ),
  ),
  skills: v.optional(v.array(v.string())),
};

// eslint-disable-next-line
const profileUpdateSchemaObject = v.object(profileUpdateSchema);
export type ProfileUpdateType = Infer<typeof profileUpdateSchemaObject>;

/**
 * Type representing a profile in the database
 */
export const profileSchema = {
  ...profileInSchema,
  userId: v.string(), // relation to user table
};

// eslint-disable-next-line
const profileSchemaObject = v.object(profileSchema);
export type ProfileType = Infer<typeof profileSchemaObject>;
export type EducationType = ProfileType["education"][number];
export type WorkExperienceType = ProfileType["workExperience"][number];
export type ProjectsType = ProfileType["projects"][number];
export type SkillsType = ProfileType["skills"];

/**
 * Profile table schema definition
 */
export const profileTables = {
  profiles: defineTable(profileSchema).index("by_userId", ["userId"]),
};

/**
 * Create a new profile
 * @param profile The profile data to create
 * @returns The ID of the newly created profile
 */
export const createProfile = mutation({
  args: {
    ...profileInSchema,
    userId: v.string(),
  },
  handler: async (ctx, { userId, ...profile }) => {
    // Check if profile already exists for this user
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      throw new Error("Profile already exists for this user");
    }

    return await ctx.db.insert("profiles", { ...profile, userId });
  },
});

/**
 * Get a profile by user ID
 * @param userId The ID of the user whose profile to fetch
 * @returns The profile data or null if not found
 */
export const getProfileByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

/**
 * Get the current user's profile
 * @returns The profile data or null if not found
 */
export const getCurrentUserProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

/**
 * Get or create a profile for the current user
 * If a profile doesn't exist, creates one with default values
 * @returns The existing or newly created profile
 */
export const getOrCreateProfile = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    // Try to find existing profile
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      return existing;
    }

    // get user from auth
    const user = await ctx.db
      .query("users")
      .withIndex("by_id", (q) => q.eq("_id", userId as Id<"users">))
      .first();

    // Create default profile if none exists
    const defaultProfile: ProfileInType = {
      name: user?.firstName ?? "Anonymous User",
      email: user?.email ?? "anonymous@example.com",
      education: [],
      workExperience: [],
      projects: [],
      skills: [],
    };

    const profileId = await ctx.db.insert("profiles", {
      ...defaultProfile,
      userId,
    });
    return await ctx.db.get(profileId);
  },
});

/**
 * Update a profile
 * @param update The profile data to update
 * @returns The ID of the updated profile
 */
export const updateProfile = mutation({
  args: {
    ...profileUpdateSchema,
    profileId: v.id("profiles"),
    userId: v.string(),
  },
  handler: async (ctx, { profileId, userId, ...update }) => {
    const existingProfile = await ctx.db.get(profileId);
    if (!existingProfile) {
      throw new Error("Profile not found");
    }

    // Ensure user can only update their own profile
    if (existingProfile.userId !== userId) {
      throw new Error("Not authorized to update this profile");
    }

    return await ctx.db.patch(profileId, update);
  },
});

/**
 * Delete a profile
 * @param profileId The ID of the profile to delete
 * @returns true if successful
 */
export const deleteProfile = mutation({
  args: { profileId: v.id("profiles"), userId: v.string() },
  handler: async (ctx, { profileId, userId }) => {
    const existingProfile = await ctx.db.get(profileId);
    if (!existingProfile) {
      throw new Error("Profile not found");
    }

    // Ensure user can only delete their own profile
    if (existingProfile.userId !== userId) {
      throw new Error("Not authorized to delete this profile");
    }

    await ctx.db.delete(profileId);
    return true;
  },
});
