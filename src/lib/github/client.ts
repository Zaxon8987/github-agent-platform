export class GitHubClient {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async fetch(path: string, options: RequestInit = {}) {
    const res = await fetch(`https://api.github.com${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "github-agent-platform",
        ...options.headers,
      },
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GitHub API error ${res.status}: ${err}`);
    }
    return res.json();
  }

  async getUser() {
    return this.fetch("/user");
  }

  async listRepos(page = 1, perPage = 30) {
    return this.fetch(`/user/repos?page=${page}&per_page=${perPage}&sort=updated`);
  }

  async getRepo(owner: string, repo: string) {
    return this.fetch(`/repos/${owner}/${repo}`);
  }

  async listIssues(owner: string, repo: string, state: "open" | "closed" | "all" = "open") {
    return this.fetch(`/repos/${owner}/${repo}/issues?state=${state}`);
  }

  async createIssue(owner: string, repo: string, title: string, body?: string, labels?: string[]) {
    return this.fetch(`/repos/${owner}/${repo}/issues`, {
      method: "POST",
      body: JSON.stringify({ title, body, labels }),
    });
  }

  async listPRs(owner: string, repo: string, state: "open" | "closed" | "all" = "open") {
    return this.fetch(`/repos/${owner}/${repo}/pulls?state=${state}`);
  }

  async createPR(owner: string, repo: string, title: string, head: string, base: string, body?: string) {
    return this.fetch(`/repos/${owner}/${repo}/pulls`, {
      method: "POST",
      body: JSON.stringify({ title, head, base, body }),
    });
  }

  async getFileContent(owner: string, repo: string, path: string, ref?: string) {
    const query = ref ? `?ref=${ref}` : "";
    return this.fetch(`/repos/${owner}/${repo}/contents/${path}${query}`);
  }

  async searchCode(query: string) {
    return this.fetch(`/search/code?q=${encodeURIComponent(query)}`);
  }

  async listBranches(owner: string, repo: string) {
    return this.fetch(`/repos/${owner}/${repo}/branches`);
  }

  async listCommits(owner: string, repo: string, branch?: string) {
    const query = branch ? `?sha=${branch}` : "";
    return this.fetch(`/repos/${owner}/${repo}/commits${query}`);
  }
}

export type GitHubRepo = Awaited<ReturnType<GitHubClient["listRepos"]>>[0];
export type GitHubIssue = Awaited<ReturnType<GitHubClient["listIssues"]>>[0];
export type GitHubPR = Awaited<ReturnType<GitHubClient["listPRs"]>>[0];
