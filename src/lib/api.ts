import type {
  ArtifactPayload,
  ProjectSummary,
  ScoreRecord,
  ScorePayload,
  Ticket,
  Turn
} from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_APPSCRIPT_BASE_URL;

function ensureBaseUrl() {
  if (!BASE_URL) {
    throw new Error('NEXT_PUBLIC_APPSCRIPT_BASE_URL is not set.');
  }
  return BASE_URL;
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    throw new Error(`Network error: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  if (!json.ok) {
    throw new Error(json.error || 'Unknown API error');
  }
  return json;
}

export async function postAction<T = unknown>(action: string, payload: any): Promise<T> {
  const res = await fetch(ensureBaseUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ action, payload })
  });
  const json = await handleResponse(res);
  return json as T;
}

export async function getLatestTicket(projectId: string): Promise<{ ticket: Ticket | null }> {
  const url = new URL(ensureBaseUrl());
  url.searchParams.set('action', 'latestTicket');
  url.searchParams.set('project_id', projectId);
  const res = await fetch(url.toString(), { cache: 'no-store' });
  const json = await handleResponse(res);
  return json as { ticket: Ticket | null };
}

export async function getProjectSummary(projectId: string): Promise<{ summary: ProjectSummary }> {
  const url = new URL(ensureBaseUrl());
  url.searchParams.set('action', 'projectSummary');
  url.searchParams.set('project_id', projectId);
  const res = await fetch(url.toString(), { cache: 'no-store' });
  const json = await handleResponse(res);
  return json as { summary: ProjectSummary };
}


export async function getScores(projectId: string): Promise<{ scores: ScoreRecord[] }> {
  const url = new URL(ensureBaseUrl());
  url.searchParams.set('action', 'listScores');
  url.searchParams.set('project_id', projectId);
  const res = await fetch(url.toString(), { cache: 'no-store' });
  const json = await handleResponse(res);
  return json as { scores: ScoreRecord[] };
}

export async function saveScene(payload: {
  scene_id: string;
  project_id: string;
  sprint: string;
  type: string;
  objective: string;
}) {
  return postAction('saveScene', payload);
}

export async function appendTurns(payload: { scene_id: string; turns: Turn[] }) {
  return postAction('appendTurns', payload);
}

export async function saveTicket(payload: Ticket) {
  return postAction('saveTicket', payload);
}

export async function saveArtifacts(scene_id: string, artifacts: ArtifactPayload[]) {
  for (const artifact of artifacts) {
    await postAction('saveArtifact', { ...artifact, scene_id });
  }
  return { ok: true };
}

export async function saveScore(payload: ScorePayload) {
  return postAction('saveScore', payload);
}

export async function saveProject(payload: {
  project_id: string;
  industry: string;
  scope: string;
  goals: string;
}) {
  return postAction('saveProject', payload);
}
