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
        messages: v.any(), // JSON OBJECT
        fileData: v.optional(v.any()),
        user: v.id("users"),

        githubRepoName: v.optional(v.string()),
        githubRepoUrl: v.optional(v.string()),
        githubBranch: v.optional(v.string()),
        lastPublishedAt: v.optional(v.string()),
    }),
});