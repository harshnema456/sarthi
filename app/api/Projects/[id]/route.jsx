// src/app/api/projects/[id]/route.jsx
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

function createConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    console.error("NEXT_PUBLIC_CONVEX_URL is not set");
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  }
  return new ConvexHttpClient(url);
}

function isDev() {
  return process.env.NODE_ENV !== "production";
}

export async function GET(req, context) {
  try {
    const { id } = await context.params; // important for Next 16+
    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const convex = createConvexClient();
    const project = await convex.query(api.projects.getByFrontendId, { id });

    // Log for server-side trace
    console.log("GET http://api/projects/${id}", { id, found: !!project });

    if (!project) {
      // In dev-mode provide more detail for debugging
      if (isDev()) {
        return NextResponse.json(
          {
            error: "Project not found",
            debug: {
              requestedId: id,
              note: "No project matched id, _id or workspaceId in Convex projects table",
              suggestion: [
                "Verify NEXT_PUBLIC_CONVEX_URL points to the same Convex deployment that holds your projects table",
                "Check the projects table in Convex dashboard for values of _id, id and workspaceId"
              ],
            },
          },
          { status: 404 }
        );
      }

      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Return project in normal operation
    return NextResponse.json(project, { status: 200 });
  } catch (err) {
    console.error("GET http://api/projects/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch project", details: String(err) }, { status: 500 });
  }
}

// PATCH & DELETE: keep same patterns (await context.params, log id)
export async function PATCH(req, context) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "Project ID is required" }, { status: 400 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const convex = createConvexClient();
    const updated = await convex.mutation(api.projects.update, { id, ...body });

    console.log("PATCH http://api/projects/${id}", { id, updated });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error("PATCH http://api/projects/[id] error:", err);
    return NextResponse.json({ error: "Failed to update project", details: String(err) }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "Project ID is required" }, { status: 400 });

    const convex = createConvexClient();
    const result = await convex.mutation(api.projects.remove, { id });

    console.log("DELETE http://api/projects/${id}", { id, result });

    if (!result?.deleted) return NextResponse.json({ error: "Project not found or not deleted" }, { status: 404 });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("DELETE http://api/projects/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete project", details: String(err) }, { status: 500 });
  }
}