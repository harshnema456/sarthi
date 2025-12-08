import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new workspace
export const CreateWorkspace = mutation({
    args: {
        messages: v.any(),
        user: v.id("users"),
    }, // handler to insert new workspace
    handler: async(ctx, args) => {
        const workspaceId = await ctx.db.insert("workspace", {
            messages: args.messages,
            user: args.user,
            fileData: {},

            // GitHub fields start empty (schema has them optional)
            // githubRepoName: undefined,
            // githubRepoUrl: undefined,
            // githubBranch: undefined,
            // lastPublishedAt: undefined,
        }); // insert new workspace
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
    }, // handler to update messages
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

// 🔥 store GitHub repo info for this workspace
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
            // use branch if provided, otherwise "main"
            githubBranch: args.branch ? "main" : args.branch,
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