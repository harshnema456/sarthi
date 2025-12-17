// convex/schema.js
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
            name: v.string(),
            email: v.string(),
            picture: v.optional(v.string()), // ← optional for Clerk
            uid: v.string(), // ← Clerk userId (PRIMARY IDENTITY)

            token: v.optional(v.number()),
            createdAt: v.optional(v.string()),

            // legacy (safe to keep, but unused by Clerk)
            emailVerified: v.optional(v.boolean()),
            lastLoginAt: v.optional(v.string()),
            provider: v.optional(v.string()),
            providerId: v.optional(v.string()),
        })
        .index("by_uid", ["uid"]) // ← REQUIRED
        .index("by_email", ["email"]), // ← OPTIONAL but useful

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

            // ⚠️ keep for now to avoid data migration
            owner: v.string(),

            // ✅ canonical owner reference (use this going forward)
            ownerId: v.optional(v.id("users")),

            description: v.optional(v.string()),
            createdAt: v.optional(v.string()),

            filesObj: v.optional(v.any()),
            filesCount: v.number(),

            workspaceId: v.optional(v.string()),
        })
        .index("by_owner", ["owner"])
        .index("by_created", ["createdAt"])
        .index("by_workspace_id", ["workspaceId"])
        .index("by_project_id", ["id"]),
});