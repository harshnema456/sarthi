// convex/functions/migrations.js
import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Migration: copy createdAt -> CreatedAt for all projects missing CreatedAt.
 * Run this once (and is safe to re-run).
 */
export const migrateCreatedAt = mutation({
    // Convex requires an args validator that's an object or v.any()
    args: v.any(),
    handler: async(ctx, _args) => {
        const all = await ctx.db.query("projects").collect();
        let patched = 0;
        const details = [];

        for (const item of all) {
            // normalize wrapper shapes: { _id, value } or plain object
            let rowId = null;
            let value = null;

            if (item && typeof item === "object" && ("_id" in item || "__id" in item) && item.value) {
                rowId = item._id || item.__id;
                value = item.value;
            } else if (item && typeof item === "object") {
                value = item;
                rowId = item._id || item.__id || item._rowId || null;
            } else {
                continue;
            }

            if (!value) continue;

            // Skip if CreatedAt already present
            if (value.CreatedAt) continue;

            // Promote createdAt -> CreatedAt when possible
            if (value.createdAt) {
                const toPatch = { CreatedAt: value.createdAt };

                if (rowId) {
                    await ctx.db.patch("projects", rowId, toPatch);
                } else {
                    // fallback: attempt to find wrapper with _id and patch by that id
                    const wrappers = await ctx.db.query("projects").collect();
                    for (const w of wrappers) {
                        if (w && w.value && w.value.id === value.id) {
                            const _rid = w._id || w.__id;
                            if (_rid) {
                                await ctx.db.patch("projects", _rid, toPatch);
                                break;
                            }
                        }
                    }
                }

                patched++;
                details.push({ frontendId: value.id, CreatedAt: value.createdAt });
            }
        }

        return { patched, details };
    },
});