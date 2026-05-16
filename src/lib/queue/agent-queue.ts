import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const agentQueue = new Queue("agent-tasks", { connection });

export type AgentTaskData = {
  agentId: string;
  agentRole: string;
  task: string;
  input: any;
  parentRunId?: string;
  chatId?: string;
  userId?: string;
  githubToken?: string;
};

export type AgentTaskResult = {
  status: "completed" | "failed";
  output: string;
  error?: string;
};

export async function createWorker(handler: (job: Job<AgentTaskData>) => Promise<AgentTaskResult>) {
  const worker = new Worker<AgentTaskData>("agent-tasks", async (job) => {
    return handler(job);
  }, { connection });

  return worker;
}

export async function enqueueAgentTask(data: AgentTaskData) {
  const job = await agentQueue.add("agent-task", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    priority: data.agentRole === "ceo" ? 1 : data.agentRole === "director" ? 2 : 3,
  });
  return job.id;
}

export { connection as redisConnection };
