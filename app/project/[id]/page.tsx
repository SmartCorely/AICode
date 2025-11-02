'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  PageHeader,
  TextArea,
  TextInput
} from '@/components/ui';
import { appendTurns, getLatestTicket, saveScene, saveTicket } from '@/lib/api';
import type { Ticket, Turn } from '@/types';
import { useToast } from '@/components/toast';

function createSceneId() {
  return `S-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}`;
}

function createTicketId() {
  return `T-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}`;
}

const roles: Turn['role'][] = ['Consultant', 'Client', 'Mentor'];

export default function SceneRunnerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const projectId = params?.id ?? '';
  const [sceneId, setSceneId] = useState('');
  const [objective, setObjective] = useState('キックオフミーティングで現状課題をヒアリングする');
  const [sprint, setSprint] = useState('Day1');
  const [sceneType, setSceneType] = useState('ヒアリング');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [syncedCount, setSyncedCount] = useState(0);
  const [currentRole, setCurrentRole] = useState<Turn['role']>('Client');
  const [utterance, setUtterance] = useState('');
  const [latestTicket, setLatestTicket] = useState<Ticket | null>(null);
  const [ticketCategory, setTicketCategory] = useState('Fit&Gap 分析');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState(
    JSON.stringify(
      {
        goal: '業務要件の整理と標準機能とのフィット確認',
        done: ['ヒアリング内容を議事録に残す', '差分要件を整理する']
      },
      null,
      2
    )
  );
  const [status, setStatus] = useState<'open' | 'in_progress' | 'done' | 'closed'>('open');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    async function fetchTicket() {
      try {
        const { ticket } = await getLatestTicket(projectId);
        setLatestTicket(ticket);
      } catch (error) {
        console.error(error);
        showToast({
          title: 'チケット取得に失敗しました',
          description: (error as Error).message,
          variant: 'error'
        });
      }
    }
    if (projectId) {
      void fetchTicket();
    }
  }, [projectId, showToast]);

  const unsyncedTurns = useMemo(() => turns.slice(syncedCount), [syncedCount, turns]);

  const handleStartScene = async () => {
    if (!projectId) return;
    const newSceneId = createSceneId();
    try {
      await saveScene({
        scene_id: newSceneId,
        project_id: projectId,
        sprint,
        type: sceneType,
        objective
      });
      setSceneId(newSceneId);
      showToast({ title: 'シーンを開始しました', variant: 'success' });
    } catch (error) {
      console.error(error);
      showToast({
        title: 'シーン開始に失敗しました',
        description: (error as Error).message,
        variant: 'error'
      });
    }
  };

  const handleAddTurn = () => {
    if (!utterance.trim()) return;
    setTurns((prev) => [
      ...prev,
      {
        turn_no: prev.length + 1,
        role: currentRole,
        utterance: utterance.trim(),
        timestamp: new Date().toISOString()
      }
    ]);
    setUtterance('');
    setCurrentRole((prev) => roles[(roles.indexOf(prev) + 1) % roles.length]);
  };

  const syncTurns = async () => {
    if (!sceneId || !unsyncedTurns.length) return;
    setSyncing(true);
    try {
      const chunkSize = 3;
      for (let i = 0; i < unsyncedTurns.length; i += chunkSize) {
        const chunk = unsyncedTurns.slice(i, i + chunkSize);
        await appendTurns({ scene_id: sceneId, turns: chunk });
      }
      setSyncedCount(turns.length);
      showToast({ title: '会話ログを保存しました', variant: 'success' });
    } catch (error) {
      console.error(error);
      showToast({
        title: '会話ログの保存に失敗しました',
        description: (error as Error).message,
        variant: 'error'
      });
    } finally {
      setSyncing(false);
    }
  };

  const finishScene = async () => {
    if (!sceneId) {
      showToast({ title: 'シーンを開始してから完了してください', variant: 'error' });
      return;
    }
    if (unsyncedTurns.length) {
      await syncTurns();
    }
    try {
      const ticketId = createTicketId();
      const criteria = JSON.parse(acceptanceCriteria);
      await saveTicket({
        ticket_id: ticketId,
        project_id: projectId,
        category: ticketCategory,
        acceptance_criteria: criteria,
        status
      });
      showToast({
        title: 'チケットを登録しました',
        description: `Ticket ID: ${ticketId}`,
        variant: 'success'
      });
      setLatestTicket({
        ticket_id: ticketId,
        project_id: projectId,
        category: ticketCategory,
        acceptance_criteria: criteria,
        status
      });
      router.push(`/project/${projectId}/artifacts/${sceneId}`);
    } catch (error) {
      console.error(error);
      showToast({
        title: 'チケット登録に失敗しました',
        description: (error as Error).message,
        variant: 'error'
      });
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <PageHeader
        title={`プロジェクト ${projectId}`}
        description="会議シーンを進行し、会話ログを保存した後に成果物チケットを受け取ります。"
      />

      <Card title="シーン設定">
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput label="スプリント/日付" value={sprint} onChange={(e) => setSprint(e.target.value)} />
          <TextInput label="シーン種別" value={sceneType} onChange={(e) => setSceneType(e.target.value)} />
          <div className="md:col-span-2">
            <TextArea
              label="シーンの目的"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              rows={3}
            />
          </div>
          <div className="md:col-span-2 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Scene ID: {sceneId || '未開始'} / 未保存ターン: {unsyncedTurns.length}
            </p>
            <div className="flex gap-2">
              <Button onClick={handleStartScene} disabled={!projectId || !!sceneId}>
                シーン開始
              </Button>
              <Button onClick={syncTurns} variant="secondary" disabled={!sceneId || !unsyncedTurns.length || syncing}>
                ログ保存
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card title="会話ログ">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <label className="flex items-center gap-2">
                <span className="text-slate-600">ロール</span>
                <select
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value as Turn['role'])}
                  className="rounded-md border border-slate-300 px-3 py-1 text-sm"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>
              <Button onClick={handleAddTurn} disabled={!sceneId || !utterance.trim()}>
                ターン追加
              </Button>
            </div>
            <TextArea
              label="発言内容"
              value={utterance}
              onChange={(e) => setUtterance(e.target.value)}
              rows={3}
            />
          </div>
          <Divider />
          {turns.length ? (
            <ol className="space-y-3">
              {turns.map((turn) => (
                <li key={turn.turn_no} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Turn {turn.turn_no}</span>
                    <span>{new Date(turn.timestamp ?? Date.now()).toLocaleString('ja-JP')}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge
                      variant={
                        turn.role === 'Consultant'
                          ? 'consultant'
                          : turn.role === 'Client'
                            ? 'client'
                            : 'mentor'
                      }
                    >
                      {turn.role}
                    </Badge>
                    <p className="text-sm text-slate-700">{turn.utterance}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState title="まだ会話がありません" description="シーンを開始して発言を記録しましょう。" />
          )}
        </div>
      </Card>

      <Card
        title="次のチケット"
        actions={
          sceneId && (
            <Button onClick={() => router.push(`/project/${projectId}/artifacts/${sceneId}`)} variant="secondary">
              成果物提出へ進む
            </Button>
          )
        }
      >
        <div className="space-y-4">
          {latestTicket ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="font-semibold text-slate-900">{latestTicket.ticket_id}</p>
              <p className="text-slate-600">カテゴリ: {latestTicket.category}</p>
              <p className="text-slate-600">ステータス: {latestTicket.status}</p>
            </div>
          ) : (
            <EmptyState title="オープンチケットはありません" description="シーン完了時に新しいチケットを発行できます。" />
          )}

          <div className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900">新規チケットを発行</h3>
            <div className="mt-3 grid gap-3">
              <TextInput label="カテゴリ" value={ticketCategory} onChange={(e) => setTicketCategory(e.target.value)} />
              <TextArea
                label="受け入れ条件 (JSON)"
                value={acceptanceCriteria}
                onChange={(e) => setAcceptanceCriteria(e.target.value)}
                rows={6}
              />
              <label className="text-sm text-slate-700">
                ステータス
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as typeof status)}
                  className="ml-3 rounded-md border border-slate-300 px-3 py-1 text-sm"
                >
                  <option value="open">open</option>
                  <option value="in_progress">in_progress</option>
                  <option value="done">done</option>
                  <option value="closed">closed</option>
                </select>
              </label>
              <Button onClick={finishScene} disabled={!sceneId}>
                チケット発行 & 成果物へ
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </main>
  );
}
