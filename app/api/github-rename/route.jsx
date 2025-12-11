// app/api/github-rename/route.js
import { NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";

export async function POST(request) {
  try {
    // parse JSON
    const body = await request.json().catch(() => null);
    const {
      repoName: incomingRepoName,
      oldBranch,
      newBranch,
      makeDefault = false,
      deleteOld = false,
    } = body || {};

    // validate request body
    if (!incomingRepoName || !oldBranch || !newBranch) {
      return NextResponse.json(
        { success: false, error: "Missing repoName, oldBranch or newBranch" },
        { status: 400 }
      );
    }

    // env checks
    const token = process.env.GITHUB_TOKEN;
    const defaultOwner = process.env.GITHUB_OWNER;
    if (!token || !defaultOwner) {
      return NextResponse.json(
        { success: false, error: "GITHUB_TOKEN or GITHUB_OWNER not configured on server" },
        { status: 500 }
      );
    }

    const octokit = new Octokit({ auth: token });

    // normalize owner/repo
    let owner = defaultOwner;
    let repo = incomingRepoName;
    if (incomingRepoName.includes("/")) {
      const parts = incomingRepoName.split("/");
      owner = parts[0];
      repo = parts.slice(1).join("/");
    }

    // ensure repository exists
    try {
      await octokit.repos.get({ owner, repo });
    } catch (err) {
      if (err.status === 404) {
        return NextResponse.json({ success: false, error: "Repository not found" }, { status: 404 });
      }
      console.error("Error fetching repo:", err);
      return NextResponse.json({ success: false, error: "Failed to fetch repository" }, { status: 500 });
    }

    // ensure oldBranch exists -> get its commit SHA
    let oldSha;
    try {
      const oldResp = await octokit.repos.getBranch({ owner, repo, branch: oldBranch });
      oldSha = oldResp.data.commit.sha;
    } catch (err) {
      if (err.status === 404) {
        return NextResponse.json({ success: false, error: `Old branch '${oldBranch}' not found `}, { status: 404 });
      }
      console.error("Error checking old branch:", err);
      return NextResponse.json({ success: false, error: "Failed checking old branch" }, { status: 500 });
    }

    // check if newBranch exists
    let newExists = false;
    try {
      await octokit.repos.getBranch({ owner, repo, branch: newBranch });
      newExists = true;
    } catch (err) {
      if (err.status === 404) {
        newExists = false;
      } else {
        console.error("Error checking new branch:", err);
        return NextResponse.json({ success: false, error: "Failed checking new branch" }, { status: 500 });
      }
    }

    // create newBranch if missing
    if (!newExists) {
      try {
        await octokit.git.createRef({
          owner,
          repo,
          ref: `refs/heads/${newBranch}`,
          sha: oldSha,
        });
      } catch (err) {
        console.error("Failed creating new branch:", err);
        return NextResponse.json({ success: false, error: err.message || "Failed to create new branch" }, { status: 500 });
      }
    }

    // optionally set new branch as default
    if (makeDefault) {
      try {
        await octokit.repos.update({ owner, repo, default_branch: newBranch });
      } catch (err) {
        console.error("Failed to set default branch:", err);
        // Return partial success: branch created but couldn't set default
        return NextResponse.json(
          { success: false, error: "Created branch but failed to set as default" },
          { status: 500 }
        );
      }
    }

    // optionally delete old branch
    if (deleteOld) {
      try {
        // re-fetch repo to get latest default branch
        const repoResp = await octokit.repos.get({ owner, repo });
        const currentDefault = repoResp.data.default_branch;

        // if oldBranch is the default, switch default to newBranch first
        if (currentDefault === oldBranch) {
          // ensure newBranch exists (should by now)
          await octokit.repos.update({ owner, repo, default_branch: newBranch });
        }

        // delete the old branch ref
        await octokit.request("DELETE /repos/{owner}/{repo}/git/refs/heads/{branch}", {
          owner,
          repo,
          branch: oldBranch,
        });
      } catch (err) {
        console.error("Failed deleting old branch:", err);
        return NextResponse.json(
          { success: false, error: "Created new branch but failed to delete old branch" },
          { status: 500 }
        );
      }
    }

    // success response
    return NextResponse.json({
      success: true,
      message: newExists ? "New branch already existed (no-op create)" : "Branch created/renamed successfully",
      repoName: `${owner}/${repo}`,
      oldBranch,
      newBranch,
      created: !newExists,
    });
  } catch (error) {
    console.error("github-rename handler error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Unknown server error" },
      { status: 500 }
    );
  }
}