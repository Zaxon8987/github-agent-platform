import { chatCompletion, SYSTEM_PROMPTS } from "@/lib/ai/openrouter";
import { findGitHubTools } from "@/lib/github/tools";
import type { SwarmPlan, AgentTask, AgentResult } from "./types";
import { createDirectors } from "./director";

export async function ceoAgent(
  goal: string,
  model: string,
  githubToken?: string,
  chatId?: string,
  userId?: string,
  onMessage?: (msg: string) => void
): Promise<{ plan: SwarmPlan; result: string }> {
  onMessage?.("🤖 CEO Agent analyzing your goal...\n");

  const availableTools = await findGitHubTools(githubToken);

  const analysisPrompt = `You are the CEO Agent. Analyze this user goal and create an execution plan.

User Goal: "${goal}"

Available GitHub Tools: ${availableTools.join(", ")}

You must break this down into sub-tasks for your Director agents.
Available Directors: Engineering, Security, Product, DevOps, Research, Quality

Output a JSON plan with:
1. Goal summary
2. Which Directors to involve
3. Specific tasks for each Director
4. Dependencies between tasks

Return ONLY valid JSON.`;

  const planStr = await chatCompletion(
    model,
    [
      { role: "system", content: SYSTEM_PROMPTS.ceo },
      { role: "user", content: analysisPrompt },
    ],
    undefined
  );

  let plan;
  try {
    const jsonMatch = planStr?.match(/\{[\s\S]*\}/);
    plan = jsonMatch ? JSON.parse(jsonMatch[0]) : { goal, tasks: [] };
  } catch {
    plan = { goal, tasks: [] };
  }

  onMessage?.("✅ Plan created. Delegating to Directors...\n");

  const directorsToUse = plan.directors || ["engineering"];
  const directorResults: AgentResult[] = [];

  for (const dir of directorsToUse) {
    const director = createDirectors(model).find((d) => d.name.toLowerCase().includes(dir.toLowerCase()));
    if (!director) continue;

    onMessage?.(`  👤 Director ${director.name} working...\n`);

    const result = await director.execute(
      plan.tasks?.filter((t: any) => t.assignedTo?.includes(dir)) || [{ description: goal }],
      githubToken,
      onMessage
    );

    directorResults.push({
      taskId: `dir-${dir}`,
      agentId: director.id,
      output: result,
      status: "completed",
    });

    onMessage?.(`  ✅ Director ${director.name} completed\n`);
  }

  onMessage?.("📋 CEO synthesizing final result...\n");

  const synthesis = directorResults.map((r) => r.output).join("\n\n");

  const finalResult = await chatCompletion(
    model,
    [
      { role: "system", content: SYSTEM_PROMPTS.ceo },
      {
        role: "user",
        content: `Synthesize these Director results into a cohesive final response for the user.\n\nOriginal Goal: ${goal}\n\nResults:\n${synthesis}`,
      },
    ],
    undefined
  );

  const swarmPlan: SwarmPlan = {
    goal,
    tasks: (plan.tasks || []).map((t: any, i: number) => ({
      id: `task-${i}`,
      description: t.description || t,
      agentId: `ceo`,
      agentRole: "ceo",
      priority: i,
      dependencies: [],
      input: t,
      chatId: chatId || "",
      userId: userId || "",
      githubToken,
    })),
    hierarchy: [{ agentId: "ceo", assignedTasks: ["synthesis"] }],
  };

  return { plan: swarmPlan, result: finalResult || synthesis };
}
