import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
// Define the database schema
export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    picture: v.string(),
    uid: v.string(),
    token: v.optional(v.number()),
  }), // users table
  workspace: defineTable({
    messages: v.any(), // JSON OBJECT
    fileData: v.optional(v.any()),
    user: v.id('users'),
  }), // workspace table
});