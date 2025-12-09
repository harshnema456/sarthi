// import { query, mutation } from "./generated/server";
// import { v } from "convex/values";

// export default mutation({
//     args: {},
//     handler: async(ctx) => {
//         const all = await ctx.db.query("projects").collect();

//         const updated = [];
//         for (const row of all) {
//             // if row already has `id` skip
//             if (row.id) continue;

//             const newId = `proj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;
//             await ctx.db.patch(row._id, { id: newId });
//             updated.push({ _id: row._id, id: newId });
//             // tiny delay not required; batching is fine
//         }
//         return { updatedCount: updated.length, updated };
//     },
// });