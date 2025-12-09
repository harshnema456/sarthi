import { query, mutation } from "./_generated/server";
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
        filesObj: v.any(),
        filesCount: v.number(),
        CreatedAt: v.string(),
    },
    handler: async(ctx, args) => {
        // insert exactly as dashboard generates
        await ctx.db.insert("projects", args);
    },
});

export const update = mutation({
    args: {
        id: v.string(),
        filesObj: v.any(),
        filesCount: v.number(),
    },
    handler: async(ctx, args) => {
        const existing = await ctx.db
            .query("projects")
            .filter((q) => q.eq(q.field("id"), args.id))
            .first();
        if (!existing) return;

        await ctx.db.patch(existing._id, {
            filesObj: args.filesObj,
            filesCount: args.filesCount,
        });
    },
});

export const remove = mutation({
    args: { id: v.string() },
    handler: async(ctx, args) => {
        const existing = await ctx.db
            .query("projects")
            .filter((q) => q.eq(q.field("id"), args.id))
            .first();
        if (!existing) return;

        await ctx.db.delete(existing._id);
    },
});