// app/api/github-publish/route.js
import { NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";

export async function POST(request) {
  try {
    const body = await request.json();
    const { repoName, files } = body || {};

    if (!repoName || !files) {
      return NextResponse.json(
        { success: false, error: "Missing repoName or files" },
        { status: 400 }
      );
    }

    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;

    if (!token || !owner) {
      return NextResponse.json(
        {
          success: false,
          error: "GITHUB_TOKEN or GITHUB_OWNER not configured on server",
        },
        { status: 500 }
      );
    }

    const octokit = new Octokit({ auth: token });

    // 1) Ensure repo exists (create if missing)
    let repoData;
    try {
      const existing = await octokit.repos.get({
        owner,
        repo: repoName,
      });
      repoData = existing.data;
    } catch (err) {
      if (err.status === 404) {
        const created = await octokit.repos.createForAuthenticatedUser({
          name: repoName,
          private: true,
          auto_init: true,
        });
        repoData = created.data;
      } else {
        console.error("Github repo error:", err);
        throw err;
      }
    }

    const branch = repoData.default_branch || "main";

    // 2) Convert Sandpack files to { path, content }
    const entries = Object.entries(files);
    for (const [rawPath, value] of entries) {
      let content = "";

      if (typeof value === "string") {
        content = value;
      } else if (typeof value === "object" && value !== null) {
        // common Sandpack structure: { code: "..." }
        content = value.code || value.contents || "";
      }

      let path = rawPath.replace(/^\/+/, "");
      if (!path) continue;

      const encoded = Buffer.from(content, "utf8").toString("base64");

      // 3) Check if file exists to get sha
      let sha;
      try {
        const existing = await octokit.repos.getContent({
          owner,
          repo: repoName,
          path,
          ref: branch,
        });

        if (!Array.isArray(existing.data)) {
          sha = existing.data.sha;
        }
      } catch (err) {
        if (err.status !== 404) {
          console.error("getContent error", path, err);
          throw err;
        }
        // new file => sha stays undefined
      }

      // 4) Create or update file
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo: repoName,
        path,
        message: `Publish from INHUB — ${path}`,
        content: encoded,
        sha,
        branch,
      });
    }

    return NextResponse.json({
      success: true,
      repoUrl: repoData.html_url,
      branch,
    });
  } catch (error) {
    console.error("GitHub publish error", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unknown server error",
      },
      { status: 500 }
    );
  }
}
