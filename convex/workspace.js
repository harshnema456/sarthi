import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new workspace (Idempotent: Returns existing if found)
// Create a new workspace (Idempotent: One user → one workspace)
export const CreateWorkspace = mutation({
    args: {
        user: v.id("users"), // ✅ ONLY user
    },
    handler: async(ctx, { user }) => {
        // 1. Check if workspace already exists
        const existing = await ctx.db
            .query("workspace")
            .withIndex("by_user", (q) => q.eq("user", user))
            .first();

        // 2. Return existing workspace
        if (existing) {
            return existing._id;
        }

        // 3. Create new workspace with defaults
        const workspaceId = await ctx.db.insert("workspace", {
            user,
            messages: [], // ✅ initialized here
            fileData: {},
            // GitHub fields start empty
        });

        return workspaceId;
    },
});


// Get workspace data by ID
export const GetWorkspace = query({
    args: {
        workspaceId: v.id("workspace"),
    },
    handler: async(ctx, args) => {
        const result = await ctx.db.get(args.workspaceId);
        return result;
    },
});

// Update messages in a workspace
export const UpdateMessages = mutation({
    args: {
        workspaceId: v.id("workspace"),
        messages: v.any(),
    },
    handler: async(ctx, args) => {
        await ctx.db.patch(args.workspaceId, {
            messages: args.messages,
        });
        return null;
    },
});

export const UpdateFiles = mutation({
    args: {
        workspaceId: v.id("workspace"),
        files: v.any(),
    },
    handler: async(ctx, args) => {
        await ctx.db.patch(args.workspaceId, {
            fileData: args.files,
        });
        return null;
    },
});

// Store GitHub repo info for this workspace
export const UpdateGithubInfo = mutation({
    args: {
        workspaceId: v.id("workspace"),
        repoName: v.string(),
        repoUrl: v.string(),
        branch: v.optional(v.string()),
    },
    handler: async(ctx, args) => {
        await ctx.db.patch(args.workspaceId, {
            githubRepoName: args.repoName,
            githubRepoUrl: args.repoUrl,
            // Logic Fixed: Agar args.branch hai to wo use karo, warna "main"
            githubBranch: args.branch || "main",
            lastPublishedAt: new Date().toISOString(),
        });
        return null;
    },
});

export const GetAllWorkspace = query({
    args: {
        userId: v.id("users"),
    },
    handler: async(ctx, args) => {
        const result = await ctx.db
            .query("workspace")
            .filter((q) => q.eq(q.field("user"), args.userId))
            .collect();

        return result;
    },
});