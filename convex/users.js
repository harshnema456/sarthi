import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
// Create a new user or return existing user
export const CreateUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    picture: v.string(),
    uid: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .collect();

    if (existing.length > 0) {
      return existing[0]._id;   // <-- return existing user ID
    }

    // Create new user
    const newUserId = await ctx.db.insert("users", {
      name: args.name,
      picture: args.picture,
      email: args.email,
      uid: args.uid,
      token: 50000,
    });

    return newUserId;  // <-- return new ID
  },
});


// Get user details by email
export const GetUser = query({
    args: {
        email: v.string(),
    },
    handler: async(ctx, args) => {
        const user = await ctx.db
            .query('users')
            .filter((q) => q.eq(q.field('email'), args.email))
            .collect();
        return user[0];
    },
});
// Update user token
export const UpdateToken = mutation({
    args: {
        token: v.number(),
        userId: v.id('users'),
    },
    handler: async(ctx, args) => {
        const result = await ctx.db.patch(args.userId, {
            token: args.token,
        });
        return result;
    }, 
});