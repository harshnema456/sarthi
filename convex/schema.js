// convex/schema.js

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";


  // Other tables here...

  

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    picture: v.string(),
    uid: v.string(),
    token: v.optional(v.number()),

    // optional extra fields coming from your auth provider / created rows
    createdAt: v.optional(v.string()),       // ISO timestamp string from Google
    emailVerified: v.optional(v.boolean()),  // true/false
    lastLoginAt: v.optional(v.string()),    // ISO timestamp string
    provider: v.optional(v.string()),        // e.g. "google"
    providerId: v.optional(v.string()),      // provider user id
  }),

  workspace: defineTable({
    messages: v.any(), // JSON array
    fileData: v.optional(v.any()),
    user: v.id("users"), // reference to users (Convex row id)

    githubRepoName: v.optional(v.string()),
    githubRepoUrl: v.optional(v.string()),
    githubBranch: v.optional(v.string()),
    lastPublishedAt: v.optional(v.string()),
  }).index("by_user", ["user"]),

  projects: defineTable({
    id: v.string(),
    name: v.string(),
    owner: v.string(),
    ownerId: v.optional(v.id("users")),
    filesObj: v.any(),
    filesCount: v.number(),
    createdAt: v.string(),
    workspaceId: v.optional(v.id("workspace")),
  }).index("by_owner", ["owner"]),

  data: defineTable({})
});

