export async function GET(req, { params }) {
    try {
        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
        }

        const convex = createConvexClient();
        const project = await convex.query(api.projects.getByFrontendId, { id });

        console.log("GET http://localhost:3000//api/projects/${id}debug:", { id, found: !!project });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        return NextResponse.json(project, { status: 200 });
    } catch (err) {
        console.error("GET http://localhost:3000//api/projects/[id] error:", err);
        return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
    }
}