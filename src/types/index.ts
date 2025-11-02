export type Project = {
  project_id: string;
  industry: string;
  scope: string;
  goals: string;
  created_at?: string;
};

export type Scene = {
  scene_id: string;
  project_id: string;
  sprint: string;
  type: string;
  objective: string;
  created_at?: string;
};

export type Turn = {
  turn_no: number;
  role: 'Consultant' | 'Client' | 'Mentor';
  utterance: string;
  timestamp?: string;
};

export type Ticket = {
  ticket_id: string;
  project_id: string;
  category: string;
  acceptance_criteria: Record<string, unknown>;
  status: 'open' | 'in_progress' | 'done' | 'closed' | string;
};

export type ArtifactType = 'Minutes' | 'FitGap' | 'TestCase';

export type ArtifactPayload = {
  scene_id: string;
  type: ArtifactType;
  content: string;
  link?: string;
};

export type ScorePayload = {
  scene_id: string;
  knowledge: number;
  standard_judgement: number;
  reproducibility: number;
  comms: number;
  feedback: string;
};

export type ProjectSummary = {
  latestScene: {
    scene_id: string;
    sprint: string;
    objective: string;
  } | null;
  openTickets: number;
  avgScore: {
    knowledge: number;
    standard_judgement: number;
    reproducibility: number;
    comms: number;
  } | null;
};

export type ScoreRecord = {
  scene_id: string;
  knowledge: number;
  standard_judgement: number;
  reproducibility: number;
  comms: number;
  feedback: string;
  timestamp?: string;
};
