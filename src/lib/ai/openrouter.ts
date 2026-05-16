import OpenAI from "openai";

export const AVAILABLE_MODELS = [
  { id: "openai/gpt-4o", name: "GPT-4o", provider: "OpenAI" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI" },
  { id: "anthropic/claude-sonnet-4.6", name: "Claude Sonnet 4.6", provider: "Anthropic" },
  { id: "anthropic/claude-haiku-4.5", name: "Claude Haiku 4.5", provider: "Anthropic" },
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google" },
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google" },
  { id: "qwen/qwen-3.6-max", name: "Qwen 3.6 Max", provider: "Qwen" },
  { id: "deepseek/deepseek-chat", name: "DeepSeek V3", provider: "DeepSeek" },
] as const;

export function createOpenRouter(apiKey?: string) {
  return new OpenAI({
    apiKey: apiKey || process.env.OPENROUTER_API_KEY,
    baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "GitHub Agent Platform",
    },
  });
}

export async function chatCompletion(
  model: string,
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  onStream?: (chunk: string) => void,
  apiKey?: string
) {
  const openrouter = createOpenRouter(apiKey);

  if (onStream) {
    const stream = await openrouter.chat.completions.create({
      model,
      messages: messages as any,
      stream: true,
    });

    let fullContent = "";
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      fullContent += content;
      onStream(content);
    }
    return fullContent;
  }

  const res = await openrouter.chat.completions.create({
    model,
    messages: messages as any,
  });

  return res.choices[0]?.message?.content || "";
}

export const SYSTEM_PROMPTS = {
  ceo: `You are the CEO Agent — the top-level orchestrator. 
Your role is to:
1. Understand the user's high-level goal
2. Break it down into clear objectives for Director agents
3. Assign tasks to the appropriate Director (Engineering, Security, Product, DevOps, Research, Quality)
4. Synthesize results from Directors into a coherent final response
5. Keep the user updated on progress

Be decisive, strategic, and clear. Always explain your plan before executing.`,

  engineering: `You are the Engineering Director Agent.
You oversee code generation, architecture decisions, code review, and technical implementation.
Break down engineering tasks and coordinate with your manager and worker agents.
Always consider best practices, security, and scalability.`,

  security: `You are the Security Director Agent.
You handle vulnerability scanning, security audits, compliance checks, and threat modeling.
Review all code and infrastructure for security issues.
Be thorough and document all findings.`,
};
