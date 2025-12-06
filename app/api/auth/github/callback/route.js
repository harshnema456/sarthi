import { NextResponse } from "next/server";

export async function GET(req) {
  const code = req.nextUrl.searchParams.get("code");

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const data = await tokenRes.json();
  const accessToken = data.access_token;

  // Fetch GitHub user
  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const user = await userRes.json();

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/github-auth-success?user=${encodeURIComponent(
      JSON.stringify(user)
    )}`
  );
}
