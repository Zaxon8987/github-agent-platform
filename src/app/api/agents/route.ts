import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createDirectors } from "@/lib/swarm/director";
import { chatCompletion, SYSTEM_PROMPTS } from "@/lib/ai/openrouter";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agents = await prisma.agent.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const defaultDirectors = createDirectors("openai/gpt-4o").map((d) => ({
    id: d.id,
    name: d.name,
    role: "director",
    specialty: d.config.specialty,
    status: "idle",
    isDefault: true,
  }));

  const ceoAgent = {
    id: "ceo",
    name: "CEO Agent",
    role: "ceo" as const,
    specialty: null,
    status: "idle" as const,
    isDefault: true,
  };

  return Response.json({
    agents: [...agents, ceoAgent, ...defaultDirectors],
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, role, specialty, model } = await req.json();

  const systemPrompt = (SYSTEM_PROMPTS as any)[role] || "";

  const agent = await prisma.agent.create({
    data: {
      name,
      role,
      specialty,
      model: model || "openai/gpt-4o",
      systemPrompt,
      ownerId: session.user.id,
      config: JSON.stringify({}),
    },
  });

  return Response.json(agent);
}
