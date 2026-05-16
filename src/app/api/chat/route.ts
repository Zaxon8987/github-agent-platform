import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { chatCompletion } from "@/lib/ai/openrouter";
import { ceoAgent } from "@/lib/swarm/ceo";
import { executeDirector } from "@/lib/swarm/director";
import { createGitHubTools } from "@/lib/github/tools";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, chatId, model = "openai/gpt-4o" } = await req.json();
  if (!message) {
    return Response.json({ error: "Message required" }, { status: 400 });
  }

  const githubToken = session.accessToken as string | undefined;

  let chat = chatId
    ? await prisma.chat.findFirst({ where: { id: chatId, userId: session.user.id } })
    : null;

  if (!chat) {
    chat = await prisma.chat.create({
      data: {
        title: message.slice(0, 80),
        userId: session.user.id,
        model,
      },
    });
  }

  await prisma.message.create({
    data: { chatId: chat.id, role: "user", content: message },
  });

  const isSwarmRequest =
    message.toLowerCase().includes("swarm") ||
    message.toLowerCase().includes("agent") ||
    message.toLowerCase().includes("delegate") ||
    message.toLowerCase().includes("orchestrate");

  let responseContent: string;

  if (isSwarmRequest) {
    const { result } = await ceoAgent(
      message,
      model,
      githubToken,
      chat.id,
      session.user.id
    );
    responseContent = result;
  } else if (
    message.toLowerCase().includes("issue") ||
    message.toLowerCase().includes("pr ") ||
    message.toLowerCase().includes("pull request") ||
    message.toLowerCase().includes("repo")
  ) {
    const dirResult = await executeDirector("engineering", message, model, githubToken);
    responseContent = dirResult;

    const tools = githubToken ? createGitHubTools(githubToken) : [];
    const toolResults: string[] = [];

    if (message.toLowerCase().includes("issue") && message.toLowerCase().includes("create")) {
      try {
        const match = message.match(/in\s+(\w+\/\w+)/i);
        if (match) {
          const createTool = tools.find((t) => t.name === "create_issue");
          if (createTool) {
            const result = await createTool.execute({
              owner: match[1].split("/")[0],
              repo: match[1].split("/")[1],
              title: message,
              body: "Created by GitHub Agent Platform",
            });
            toolResults.push(`✅ Issue created: ${(result as any).html_url}`);
          }
        }
      } catch (e: any) {
        toolResults.push(`⚠️ Could not auto-create issue: ${e.message}`);
      }
    }

    if (toolResults.length > 0) {
      responseContent += "\n\n" + toolResults.join("\n");
    }
  } else {
    const history = await prisma.message.findMany({
      where: { chatId: chat.id },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    const messages = history.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    }));

    responseContent =
      (await chatCompletion(model, messages)) || "No response generated.";
  }

  const assistantMsg = await prisma.message.create({
    data: { chatId: chat.id, role: "assistant", content: responseContent },
  });

  return Response.json({
    message: assistantMsg,
    chatId: chat.id,
    content: responseContent,
  });
}
