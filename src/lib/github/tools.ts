import { GitHubClient } from "./client";

export type GitHubTool = {
  name: string;
  description: string;
  execute: (params: any) => Promise<any>;
};

export async function findGitHubTools(token?: string): Promise<string[]> {
  return [
    "get_user - Get authenticated user info",
    "list_repos - List user repositories",
    "get_repo - Get repository details",
    "list_issues - List repository issues",
    "create_issue - Create a new issue",
    "list_prs - List pull requests",
    "create_pr - Create a pull request",
    "get_file - Get file contents from a repo",
    "search_code - Search code across GitHub",
    "list_branches - List repository branches",
    "list_commits - List repository commits",
  ];
}

export function createGitHubTools(token: string): GitHubTool[] {
  const client = new GitHubClient(token);

  return [
    {
      name: "get_user",
      description: "Get the authenticated user's GitHub profile",
      execute: () => client.getUser(),
    },
    {
      name: "list_repos",
      description: "List repositories for the authenticated user",
      execute: (params: { page?: number; perPage?: number }) =>
        client.listRepos(params.page, params.perPage),
    },
    {
      name: "get_repo",
      description: "Get details of a specific repository",
      execute: (params: { owner: string; repo: string }) =>
        client.getRepo(params.owner, params.repo),
    },
    {
      name: "list_issues",
      description: "List issues in a repository",
      execute: (params: { owner: string; repo: string; state?: string }) =>
        client.listIssues(params.owner, params.repo, params.state as any),
    },
    {
      name: "create_issue",
      description: "Create a new issue in a repository",
      execute: (params: { owner: string; repo: string; title: string; body?: string; labels?: string[] }) =>
        client.createIssue(params.owner, params.repo, params.title, params.body, params.labels),
    },
    {
      name: "list_prs",
      description: "List pull requests in a repository",
      execute: (params: { owner: string; repo: string; state?: string }) =>
        client.listPRs(params.owner, params.repo, params.state as any),
    },
    {
      name: "create_pr",
      description: "Create a pull request",
      execute: (params: { owner: string; repo: string; title: string; head: string; base: string; body?: string }) =>
        client.createPR(params.owner, params.repo, params.title, params.head, params.base, params.body),
    },
    {
      name: "get_file",
      description: "Get file contents from a repository",
      execute: (params: { owner: string; repo: string; path: string; ref?: string }) =>
        client.getFileContent(params.owner, params.repo, params.path, params.ref),
    },
    {
      name: "search_code",
      description: "Search code across GitHub",
      execute: (params: { query: string }) => client.searchCode(params.query),
    },
    {
      name: "list_branches",
      description: "List branches in a repository",
      execute: (params: { owner: string; repo: string }) =>
        client.listBranches(params.owner, params.repo),
    },
    {
      name: "list_commits",
      description: "List commits in a repository",
      execute: (params: { owner: string; repo: string; branch?: string }) =>
        client.listCommits(params.owner, params.repo, params.branch),
    },
  ];
}
