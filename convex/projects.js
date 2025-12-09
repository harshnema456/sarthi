// src/convex/projects.js
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
    args: { owner: v.string() },
    handler: async(ctx, args) => {
        return await ctx.db
            .query("projects")
            .withIndex("by_owner", (q) => q.eq("owner", args.owner))
            .order("desc")
            .collect();
    },
});

export const Create = mutation({
    args: {
        id: v.string(),
        name: v.string(),
        owner: v.string(),
        filesObj: v.optional(v.any()),
        filesCount: v.optional(v.float64()),
        createdAt: v.optional(v.string()),
        CreatedAt: v.optional(v.string()),
        ownerId: v.optional(v.id("users")),
        workspaceId: v.optional(v.id("workspace")), // FIXED: "workspaces" → "workspace"
    },
    handler: async(ctx, args) => {
        // FIX: proper fallback order
        const createdAt =
            args.createdAt ||
            args.CreatedAt ||
            new Date().toISOString();

        await ctx.db.insert("projects", {
            id: args.id,
            name: args.name,
            owner: args.owner,

            createdAt, // required by schema

            filesObj: args.filesObj || {},
            filesCount: typeof args.filesCount === "number" ? args.filesCount : 0,

            // Optional relational fields
            ...(args.ownerId ? { ownerId: args.ownerId } : {}),
            ...(args.workspaceId ? { workspaceId: args.workspaceId } : {}),
        });
    },
});

export const update = mutation({
    args: {
        id: v.string(), // FIX: you previously used v.id("projects") which requires a DB _id, not your custom id
        filesObj: v.optional(v.any()),
        filesCount: v.optional(v.float64()),
    },

    handler: async(ctx, args) => {
        const existing = await ctx.db
            .query("projects")
            .withIndex("by_id", (q) => q.eq("id", args.id))
            .unique();

        if (!existing) return;

        const patch = {};

        if (args.filesObj !== undefined) patch.filesObj = args.filesObj;
        if (args.filesCount !== undefined) patch.filesCount = args.filesCount;

        await ctx.db.patch(existing._id, patch);
    },
});

export const remove = mutation({
    args: { id: v.string() },

    handler: async(ctx, args) => {
        const existing = await ctx.db
            .query("projects")
            .withIndex("by_id", (q) => q.eq("id", args.id))
            .unique();

        if (!existing) return;

        await ctx.db.delete(existing._id);
    },
});