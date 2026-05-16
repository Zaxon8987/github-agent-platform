"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bot, Github, Users } from "lucide-react";

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.push("/dashboard");
  }, [session, router]);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
      <div className="flex flex-col items-center gap-8 max-w-md text-center px-4">
        <div className="flex items-center gap-3">
          <Bot className="h-12 w-12 text-primary" />
          <h1 className="text-3xl font-bold">GitHub Agent Platform</h1>
        </div>

        <p className="text-muted-foreground text-lg">
          A multi-agent AI swarm that orchestrates your GitHub workflow.
          CEO agents, Directors, and Workers powered by GPT-4o, Claude,
          Gemini, and more.
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button
            size="lg"
            className="gap-3 text-base"
            onClick={() => signIn("github", { redirectTo: "/dashboard" })}
          >
            <Github className="h-5 w-5" />
            Sign in with GitHub
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4 w-full text-sm text-muted-foreground">
          <div className="flex flex-col items-center gap-1 p-3 rounded-lg border border-border">
            <Bot className="h-6 w-6 text-primary" />
            <span>Swarm AI</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 rounded-lg border border-border">
            <Users className="h-6 w-6 text-primary" />
            <span>1000 Agents</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 rounded-lg border border-border">
            <Github className="h-6 w-6 text-primary" />
            <span>GitHub Ops</span>
          </div>
        </div>
      </div>
    </div>
  );
}
