// convex/projects.js
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
 
/**
 * Optimized Find Function
 * Ye function ab loop nahi karega, direct Index use karega.
 */
async function findProjectByFrontendId(ctx, frontendId) {
  // 1. Check by Custom Project ID (Fast Index)
  const projectById = await ctx.db
    .query("projects")
    .withIndex("by_project_id", (q) => q.eq("id", frontendId))
    .first();
 
  if (projectById) return projectById;
 
  // 2. Check by Workspace ID (Fast Index) - YE WALA TUMHARA ISSUE FIX KAREGA
  const projectByWorkspace = await ctx.db
    .query("projects")
    .withIndex("by_workspace_id", (q) => q.eq("workspaceId", frontendId))
    .first();
 
  if (projectByWorkspace) return projectByWorkspace;
 
  // 3. Check by System _id (Fallback)
  try {
    const projectBySystemId = await ctx.db.get(frontendId);
    if (projectBySystemId) return projectBySystemId;
  } catch (e) {
    // Not a valid system ID, ignore
  }
 
  return null;
}
 
export const Create = mutation({
  args: v.object({
    id: v.string(),
    name: v.string(),
    owner: v.string(),
    ownerId: v.optional(v.id("users")),
    filesObj: v.optional(v.any()),
    filesCount: v.number(),
   
    // Support both casings to be safe
    CreatedAt: v.optional(v.string()),
    createdAt: v.optional(v.string()),
   
    // Accepting string is safer for passing URL params
    workspaceId: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Ensure createdAt is always set
    const finalArgs = {
      ...args,
      createdAt: args.createdAt || args.CreatedAt || new Date().toISOString(),
    };
   
    const _id = await ctx.db.insert("projects", finalArgs);
    return { ...finalArgs, _id };
  },
});
 
export const update = mutation({
  args: v.object({
    id: v.string(),
    filesObj: v.optional(v.any()),
    filesCount: v.optional(v.number()),
    name: v.optional(v.string()),
    owner: v.optional(v.string()),
    ownerProvided: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
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
    if (typeof args.filesCount !== "undefined") patch.filesCount = args.filesCount;
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
    id: v.string(),
    owner: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
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
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_owner", (q) => q.eq("owner", args.owner))
      .order("desc")
      .collect();
  },
});
 
export const getByFrontendId = query({
  args: v.object({ id: v.string() }),
  handler: async (ctx, args) => {
    const doc = await findProjectByFrontendId(ctx, args.id);
    return doc; // Returns null if not found (handled by API)
  },
});