"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, MessageSquare, Users, GitBranch, GitPullRequest, Bug, Star, Activity } from "lucide-react";
import Link from "next/link";

type DashboardData = {
  user: any;
  repos: any[];
  issues: any[];
  prs: any[];
  agents: any[];
  chats: any[];
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      Promise.all([
        fetch("/api/github?action=user").then((r) => r.json()),
        fetch("/api/github?action=repos").then((r) => r.json()),
        fetch("/api/agents").then((r) => r.json()),
        fetch("/api/chat/history").then((r) => r.json()),
      ])
        .then(([user, repos, agentsRes, chats]) => {
          setData({
            user,
            repos: Array.isArray(repos) ? repos.slice(0, 5) : [],
            issues: [],
            prs: [],
            agents: agentsRes.agents || [],
            chats: Array.isArray(chats) ? chats : [],
          });
        })
        .finally(() => setLoading(false));
    }
  }, [session]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    {
      label: "Repositories",
      value: data?.repos?.length || 0,
      icon: GitBranch,
    },
    {
      label: "Active Agents",
      value: data?.agents?.length || 0,
      icon: Users,
    },
    {
      label: "Conversations",
      value: data?.chats?.length || 0,
      icon: MessageSquare,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {data?.user?.login || session?.user?.name}
          </p>
        </div>
        <Link href="/chat">
          <Button className="gap-2">
            <MessageSquare className="h-4 w-4" />
            New Chat
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-lg border border-border p-4 flex items-center gap-4"
            >
              <div className="p-2 rounded-md bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border p-4">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary" />
            Recent Repositories
          </h2>
          <div className="space-y-2">
            {data?.repos?.map((repo: any) => (
              <a
                key={repo.id}
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{repo.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {repo.stargazers_count}
                  </span>
                  {repo.language && (
                    <Badge variant="secondary" className="text-xs">
                      {repo.language}
                    </Badge>
                  )}
                </div>
              </a>
            ))}
            {(!data?.repos || data.repos.length === 0) && (
              <p className="text-sm text-muted-foreground">No repositories found</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border p-4">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Agent Swarm
          </h2>
          <div className="space-y-2">
            {data?.agents?.slice(0, 5).map((agent: any) => (
              <div
                key={agent.id}
                className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{agent.name}</span>
                </div>
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
            ))}
            <Link href="/agents">
              <Button variant="ghost" size="sm" className="w-full mt-2">
                Manage Agents
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border p-4">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          Recent Conversations
        </h2>
        <div className="space-y-2">
          {data?.chats?.slice(0, 5).map((chat: any) => (
            <Link
              key={chat.id}
              href={`/chat?id=${chat.id}`}
              className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors"
            >
              <span className="text-sm">{chat.title}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(chat.updatedAt).toLocaleDateString()}
              </span>
            </Link>
          ))}
          {(!data?.chats || data.chats.length === 0) && (
            <p className="text-sm text-muted-foreground">No conversations yet. Start a chat!</p>
          )}
        </div>
      </div>
    </div>
  );
}
