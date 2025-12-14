import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
 
// Create a new workspace (Idempotent: Returns existing if found)
export const CreateWorkspace = mutation({
    args: {
        messages: v.any(),
        user: v.id("users"),
    },
    handler: async (ctx, args) => {
        // 1. Check if workspace already exists for this user
        // Hum "by_user" index ka use karenge jo fast lookup karega
        const existing = await ctx.db
            .query("workspace")
            .withIndex("by_user", (q) => q.eq("user", args.user))
            .first();
 
        // 2. Agar workspace mil gaya, to wahi purani ID return karo
        if (existing) {
            return existing._id;
        }
 
        // 3. Agar nahi mila, tabhi naya create karo
        const workspaceId = await ctx.db.insert("workspace", {
            messages: args.messages,
            user: args.user,
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
    handler: async (ctx, args) => {
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
    handler: async (ctx, args) => {
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
    handler: async (ctx, args) => {
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
    handler: async (ctx, args) => {
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
    handler: async (ctx, args) => {
        const result = await ctx.db
            .query("workspace")
            .filter((q) => q.eq(q.field("user"), args.userId))
            .collect();
 
        return result;
    },
});