import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/* =====================================================
   CREATE USER (IDEMPOTENT BY CLERK UID)
===================================================== */
export const CreateUser = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        picture: v.optional(v.string()),
        uid: v.string(), // Clerk userId
    },
    handler: async(ctx, args) => {
        // 1. Check by Clerk uid (PRIMARY)
        const existing = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", args.uid))
            .first();

        if (existing) {
            return existing._id;
        }

        // 2. Create user once
        return await ctx.db.insert("users", {
            name: args.name,
            email: args.email,
            picture: args.picture,
            uid: args.uid,
            token: 50000,
            createdAt: new Date().toISOString(),
        });
    },
});

/* =====================================================
   GET USER (BY CLERK UID)
===================================================== */
export const GetUserByUid = query({
    args: {
        uid: v.string(),
    },
    handler: async(ctx, { uid }) => {
        return await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", uid))
            .first();
    },
});

/* =====================================================
   (OPTIONAL) GET USER BY EMAIL — LEGACY ONLY
===================================================== */
export const GetUserByEmail = query({
    args: {
        email: v.string(),
    },
    handler: async(ctx, { email }) => {
        return await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", email))
            .first();
    },
});

/* =====================================================
   UPDATE TOKEN (UNCHANGED)
===================================================== */
export const UpdateToken = mutation({
    args: {
        token: v.number(),
        userId: v.id("users"),
    },
    handler: async(ctx, { token, userId }) => {
        return await ctx.db.patch(userId, { token });
    },
});