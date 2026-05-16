import { auth } from "@/lib/auth";
import { GitHubClient } from "@/lib/github/client";
import { createGitHubTools } from "@/lib/github/tools";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "user";
  const client = new GitHubClient(session.accessToken as string);

  try {
    let data;
    switch (action) {
      case "user":
        data = await client.getUser();
        break;
      case "repos":
        data = await client.listRepos();
        break;
      case "issues": {
        const owner = url.searchParams.get("owner");
        const repo = url.searchParams.get("repo");
        if (!owner || !repo) throw new Error("owner and repo required");
        data = await client.listIssues(owner, repo);
        break;
      }
      case "prs": {
        const owner = url.searchParams.get("owner");
        const repo = url.searchParams.get("repo");
        if (!owner || !repo) throw new Error("owner and repo required");
        data = await client.listPRs(owner, repo);
        break;
      }
      case "tools":
        data = createGitHubTools(session.accessToken as string).map((t) => ({
          name: t.name,
          description: t.description,
        }));
        break;
      default:
        data = await client.getUser();
    }
    return Response.json(data);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
