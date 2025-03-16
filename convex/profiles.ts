import { Infer, v } from "convex/values";
import { defineTable } from "convex/server";

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
  skills: v.record(v.string(), v.array(v.string())),
};

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
  skills: v.optional(v.record(v.string(), v.array(v.string()))),
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

/**
 * Profile table schema definition
 */
export const profileTables = {
  profiles: defineTable(profileSchema).index("by_userId", ["userId"]),
};
