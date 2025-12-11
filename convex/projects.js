// convex/projects.js
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Find a project document by ANY of:
 * - its custom "id" field (e.g. "proj-mj0kiuvt85g4")
 * - its Convex _id string
 * - its workspaceId string (e.g. "j97...0gzq")  <-- what CodeView is using
 */
async function findProjectByFrontendId(ctx, frontendId) {
    const docs = await ctx.db.query("projects").collect();

    for (const doc of docs) {
        if (!doc) continue;

        // 1) Custom project id
        if (doc.id === frontendId) return doc;

        // 2) Convex document id
        if (String(doc._id) === frontendId) return doc;

        // 3) Workspace id (this is what your URL currently carries)
        if (doc.workspaceId && String(doc.workspaceId) === frontendId) return doc;
    }

    return null;
}

export const Create = mutation({
    args: v.object({
        id: v.string(), // "proj-..." id
        name: v.string(),
        owner: v.string(),
        ownerId: v.optional(v.id("users")),
        filesObj: v.optional(v.any()),
        filesCount: v.number(),
        CreatedAt: v.optional(v.string()),
        workspaceId: v.optional(v.id("workspace")), // note: Convex id type
    }),
    handler: async(ctx, args) => {
        const _id = await ctx.db.insert("projects", args);
        return {...args, _id };
    },
});

export const update = mutation({
    args: v.object({
        id: v.string(), // same identifier you pass in URL (proj- / _id / workspaceId)
        filesObj: v.optional(v.any()),
        filesCount: v.optional(v.number()),
        name: v.optional(v.string()),
        owner: v.optional(v.string()),
        ownerProvided: v.optional(v.string()),
    }),
    handler: async(ctx, args) => {
        const existing = await findProjectByFrontendId(ctx, args.id);

        if (!existing) {
            throw new Error(`Project not found: ${args.id}`);
        }

        if (
            args.ownerProvided &&
            existing.owner &&
            existing.owner !== args.ownerProvided
        ) {
            throw new Error("Not the owner of this project");
        }

        const patch = {};

        if (typeof args.filesObj !== "undefined") patch.filesObj = args.filesObj;
        if (typeof args.filesCount !== "undefined")
            patch.filesCount = args.filesCount;
        if (typeof args.name !== "undefined") patch.name = args.name;
        if (typeof args.owner !== "undefined") patch.owner = args.owner;

        if (Object.keys(patch).length === 0) {
            return { id: args.id, patched: {} };
        }

        await ctx.db.patch(existing._id, patch);
        return { id: args.id, patched: patch };
    },
});

export const remove = mutation({
    args: v.object({
        id: v.string(), // same identifier as URL
        owner: v.optional(v.string()),
    }),
    handler: async(ctx, args) => {
        const existing = await findProjectByFrontendId(ctx, args.id);

        if (!existing) {
            return { id: args.id, deleted: false };
        }

        if (args.owner && existing.owner && existing.owner !== args.owner) {
            throw new Error("Permission denied: owner mismatch");
        }

        await ctx.db.delete(existing._id);
        return { id: args.id, deleted: true };
    },
});

export const list = query({
    args: v.object({ owner: v.string() }),
    handler: async(ctx, args) => {
        return await ctx.db
            .query("projects")
            .withIndex("by_owner", (q) => q.eq("owner", args.owner))
            .order("desc")
            .collect();
    },
});

export const getByFrontendId = query({
    args: v.object({ id: v.string() }),
    handler: async(ctx, args) => {
        const doc = await findProjectByFrontendId(ctx, args.id);
        if (!doc) return null;
        return doc;
    },
});