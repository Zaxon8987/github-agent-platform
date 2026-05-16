"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Crown, Shield, Code, GitBranch, UserCheck, Activity, Plus, Network } from "lucide-react";
import Link from "next/link";

type Agent = {
  id: string;
  name: string;
  role: string;
  specialty?: string;
  status: string;
  isDefault?: boolean;
  model?: string;
};

const ROLE_ICONS: Record<string, any> = {
  ceo: Crown,
  director: Code,
  manager: UserCheck,
  worker: Bot,
};

const SPECIALTY_COLORS: Record<string, string> = {
  engineering: "bg-blue-500/10 text-blue-400",
  security: "bg-red-500/10 text-red-400",
  product: "bg-purple-500/10 text-purple-400",
  devops: "bg-orange-500/10 text-orange-400",
  research: "bg-cyan-500/10 text-cyan-400",
  quality: "bg-green-500/10 text-green-400",
};

export default function AgentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/agents")
        .then((r) => r.json())
        .then((data) => {
          setAgents(data.agents || []);
        })
        .finally(() => setLoading(false));
    }
  }, [session]);

  const hierarchy = {
    ceo: agents.filter((a) => a.role === "ceo"),
    directors: agents.filter((a) => a.role === "director"),
    managers: agents.filter((a) => a.role === "manager"),
    workers: agents.filter((a) => a.role === "worker"),
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agent Swarm</h1>
          <p className="text-muted-foreground">
            Hierarchical multi-agent orchestration — CEO → Directors → Managers → Workers
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/chat">
            <Button className="gap-2">
              <Bot className="h-4 w-4" />
              Deploy Swarm
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-8 p-4 rounded-lg border border-border bg-accent/30">
        <div className="flex items-center gap-3 mb-3">
          <Network className="h-5 w-5 text-primary" />
          <span className="font-semibold">Swarm Architecture</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="default" className="gap-1">
            <Crown className="h-3 w-3" />
            CEO
          </Badge>
          <span className="text-muted-foreground">→</span>
          <Badge variant="secondary" className="gap-1">
            <Code className="h-3 w-3" />
            Directors
          </Badge>
          <span className="text-muted-foreground">→</span>
          <Badge variant="outline" className="gap-1">
            <UserCheck className="h-3 w-3" />
            Managers
          </Badge>
          <span className="text-muted-foreground">→</span>
          <Badge variant="outline" className="gap-1">
            <Bot className="h-3 w-3" />
            Workers
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        {agents.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No agents configured yet. Start a chat to deploy the swarm.</p>
          </div>
        )}

        {agents.map((agent) => {
          const Icon = ROLE_ICONS[agent.role] || Bot;
          const colorClass = agent.role === "ceo"
            ? "border-primary/30"
            : agent.role === "director"
            ? "border-blue-500/20"
            : "border-border";

          return (
            <div
              key={agent.id}
              className={`rounded-lg border ${colorClass} p-4 hover:bg-accent/50 transition-colors cursor-pointer`}
              onClick={() => setSelectedAgent(
                selectedAgent?.id === agent.id ? null : agent
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-md ${
                      agent.role === "ceo"
                        ? "bg-primary/10"
                        : agent.role === "director"
                        ? "bg-blue-500/10"
                        : "bg-muted"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        agent.role === "ceo"
                          ? "text-primary"
                          : agent.role === "director"
                          ? "text-blue-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{agent.name}</span>
                      <Badge
                        variant={
                          agent.role === "ceo"
                            ? "default"
                            : agent.role === "director"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {agent.role}
                      </Badge>
                    </div>
                    {agent.specialty && (
                      <Badge
                        className={`mt-1 text-xs ${
                          SPECIALTY_COLORS[agent.specialty] || ""
                        }`}
                      >
                        {agent.specialty}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={agent.status === "idle" ? "success" : "warning"}
                    className="text-xs"
                  >
                    {agent.status}
                  </Badge>
                  {agent.isDefault && (
                    <Badge variant="outline" className="text-xs">
                      built-in
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Activity className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
