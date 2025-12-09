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
        // new: frontend-stable id (e.g. 'proj-abc123')
        id: v.string(),

        name: v.string(),
        owner: v.string(), // human-readable owner (email or username)
        ownerId: v.optional(v.id("users")), // optional reference to users table
        filesObj: v.any(),
        filesCount: v.number(),
        createdAt: v.string(),

        // optional link to workspace row
        workspaceId: v.optional(v.id("workspace")),
    }).index("by_owner", ["owner"]),
});