import { chatCompletion } from "@/lib/ai/openrouter";
import { GitHubClient } from "@/lib/github/client";
import type { AgentConfig } from "./types";

interface DirectorAgent {
  id: string;
  name: string;
  config: AgentConfig;
  execute: (tasks: any[], githubToken?: string, onMessage?: (msg: string) => void) => Promise<string>;
}

function createDirectorAgent(
  id: string,
  name: string,
  specialty: string,
  systemPrompt: string,
  model: string
): DirectorAgent {
  return {
    id,
    name,
    config: {
      id,
      name,
      role: "director",
      specialty: specialty as any,
      model,
      systemPrompt,
      children: [],
    },
    async execute(tasks, githubToken, onMessage) {
      const taskDescriptions = tasks.map((t) => t.description || JSON.stringify(t)).join("\n");

      const github = githubToken ? new GitHubClient(githubToken) : null;
      let repoContext = "";
      if (github) {
        try {
          const repos = await github.listRepos(1, 5);
          repoContext = `\nUser's GitHub repos: ${(repos as any[])
            .map((r: any) => r.full_name)
            .join(", ")}`;
        } catch {}
      }

      const result = await chatCompletion(
        model,
        [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Execute these tasks:\n${taskDescriptions}\n\n${repoContext}\n\nProvide detailed results. If GitHub operations are needed, describe what should be done.`,
          },
        ],
        undefined
      );

      return result || "No output generated.";
    },
  };
}

export function createDirectors(model: string): DirectorAgent[] {
  return [
    createDirectorAgent(
      "dir-eng",
      "Engineering Director",
      "engineering",
      `You are the Engineering Director. You oversee code generation, architecture, and technical implementation.
Analyze tasks and provide detailed technical solutions. Include code snippets, architecture recommendations, and best practices.
Coordinate with your team to implement solutions.`,
      model
    ),
    createDirectorAgent(
      "dir-sec",
      "Security Director",
      "security",
      `You are the Security Director. You handle vulnerability assessment, security auditing, and compliance.
Review all code and configurations for security issues. Check for: XSS, SQLi, CSRF, authentication flaws, dependency vulnerabilities.
Provide concrete remediation steps.`,
      model
    ),
    createDirectorAgent(
      "dir-product",
      "Product Director",
      "product",
      `You are the Product Director. You handle feature planning, requirements analysis, and user stories.
Break down user goals into clear product requirements, prioritize features, and define acceptance criteria.
Think about the user experience and business value.`,
      model
    ),
    createDirectorAgent(
      "dir-devops",
      "DevOps Director",
      "devops",
      `You are the DevOps Director. You handle CI/CD, infrastructure, deployment, and monitoring.
Design deployment pipelines, recommend infrastructure setup, and ensure reliable operations.
Consider scalability, cost, and maintainability.`,
      model
    ),
    createDirectorAgent(
      "dir-research",
      "Research Director",
      "research",
      `You are the Research Director. You handle codebase exploration, documentation analysis, and finding relevant information.
Search through repositories, analyze code structure, and provide insights.
Be thorough and detailed in your findings.`,
      model
    ),
    createDirectorAgent(
      "dir-quality",
      "Quality Director",
      "quality",
      `You are the Quality Director. You handle testing, QA, linting, and code quality assurance.
Define test strategies, review code quality, and ensure standards are met.
Consider unit tests, integration tests, and E2E tests.`,
      model
    ),
  ];
}

export async function executeDirector(
  specialty: string,
  task: string,
  model: string,
  githubToken?: string
) {
  const directors = createDirectors(model);
  const director = directors.find(
    (d) => d.config.specialty === specialty || d.name.toLowerCase().includes(specialty.toLowerCase())
  );

  if (!director) {
    return `No director found for specialty: ${specialty}`;
  }

  return director.execute([{ description: task }], githubToken);
}
