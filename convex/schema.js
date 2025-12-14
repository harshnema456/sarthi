// convex/schema.js
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
 
export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    picture: v.string(),
    uid: v.string(),
    token: v.optional(v.number()),
 
    createdAt: v.optional(v.string()),
    emailVerified: v.optional(v.boolean()),
    lastLoginAt: v.optional(v.string()),
    provider: v.optional(v.string()),
    providerId: v.optional(v.string()),
  }),
 
  workspace: defineTable({
    name: v.optional(v.string()),
    


    messages: v.any(),
    fileData: v.optional(v.any()),
    user: v.id("users"),
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


    description: v.optional(v.string()),
    CreatedAt: v.optional(v.string()),
    createdAt: v.optional(v.string()),
 
    filesObj: v.optional(v.any()),
    filesCount: v.number(),
 
   
    workspaceId: v.optional(v.string()),
  })
  .index("by_owner", ["owner"])
  .index("by_created", ["CreatedAt"])
 
  .index("by_workspace_id", ["workspaceId"])
  .index("by_project_id", ["id"]),
});