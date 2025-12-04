import { NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";

export async function POST(req) {
  try {
    const { repoName, files } = await req.json();

    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    const owner = process.env.GITHUB_USERNAME;

    // Create repo
    await octokit.repos.createForAuthenticatedUser({
      name: repoName,
      private: false
    });

    //Upload files
    for (const path of Object.keys(files)) {
      const content = Buffer.from(files[path]).toString("base64");

      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo: repoName,
        path: path.replace(/^\//, ""),
        message: "Add file",
        content
      });
    }

    return NextResponse.json({
      success: true,
      repoUrl: `https://github.com/${owner}/${repoName}`
    });

  } catch (err) {
    console.error("GITHUB ERROR:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
