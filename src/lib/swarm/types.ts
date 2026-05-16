export type AgentRole = "ceo" | "director" | "manager" | "worker";

export type AgentSpecialty =
  | "engineering"
  | "security"
  | "product"
  | "devops"
  | "research"
  | "quality";

export type AgentConfig = {
  id: string;
  name: string;
  role: AgentRole;
  specialty?: AgentSpecialty;
  model: string;
  systemPrompt: string;
  parentId?: string;
  children: AgentConfig[];
};

export type AgentTask = {
  id: string;
  description: string;
  agentId: string;
  agentRole: AgentRole;
  priority: number;
  dependencies: string[];
  input: any;
  chatId: string;
  userId: string;
  githubToken?: string;
};

export type AgentResult = {
  taskId: string;
  agentId: string;
  output: string;
  status: "completed" | "failed";
  error?: string;
  subResults?: AgentResult[];
};

export type SwarmPlan = {
  goal: string;
  tasks: AgentTask[];
  hierarchy: { agentId: string; assignedTasks: string[] }[];
};
