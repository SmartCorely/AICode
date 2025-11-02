'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, EmptyState, PageHeader } from '@/components/ui';
import { getScores } from '@/lib/api';
import type { ScoreRecord } from '@/types';
import { useToast } from '@/components/toast';

const scoreKeys: Array<keyof Pick<ScoreRecord, 'knowledge' | 'standard_judgement' | 'reproducibility' | 'comms'>> = [
  'knowledge',
  'standard_judgement',
  'reproducibility',
  'comms'
];

export default function ScoreListPage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id ?? '';
  const { showToast } = useToast();
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchScores() {
      setLoading(true);
      try {
        const { scores } = await getScores(projectId);
        setScores(scores);
      } catch (error) {
        console.error(error);
        showToast({
          title: 'スコアの取得に失敗しました',
          description: (error as Error).message,
          variant: 'error'
        });
      } finally {
        setLoading(false);
      }
    }
    if (projectId) {
      void fetchScores();
    }
  }, [projectId, showToast]);

  const averages = useMemo(() => {
    if (!scores.length) return null;
    const totals = scoreKeys.reduce<Record<string, number>>((acc, key) => {
      acc[key] = scores.reduce((sum, score) => sum + Number(score[key] ?? 0), 0);
      return acc;
    }, {} as Record<string, number>);
    return Object.fromEntries(
      scoreKeys.map((key) => [key, Math.round((totals[key] / scores.length) * 10) / 10])
    ) as Record<(typeof scoreKeys)[number], number>;
  }, [scores]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10">
      <PageHeader
        title={`スコア履歴 - ${projectId}`}
        description="各シーンでのメンター評価を確認します。平均スコアを参考に学習計画を見直しましょう。"
      />

      <Card title="平均スコア">
        {averages ? (
          <div className="grid gap-4 md:grid-cols-2">
            {scoreKeys.map((label) => (
              <div key={label} className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">{label}</span>
                <div className="h-3 rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${(averages[label] / 5) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500">平均 {averages[label].toFixed(1)} / 5</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="スコアがまだありません" description="成果物提出後に評価が表示されます。" />
        )}
      </Card>

      <Card title="スコア詳細">
        {scores.length ? (
          <div className="space-y-4">
            {scores.map((score) => (
              <div key={score.scene_id + (score.timestamp ?? '')} className="rounded-lg border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">Scene {score.scene_id}</p>
                <p className="text-xs text-slate-500">{score.timestamp}</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {scoreKeys.map((label) => (
                    <p key={label} className="text-sm text-slate-700">
                      {label}: <span className="font-semibold">{score[label]}</span>
                    </p>
                  ))}
                </div>
                {score.feedback && <p className="mt-3 text-sm text-slate-600">FB: {score.feedback}</p>}
              </div>
            ))}
          </div>
        ) : loading ? (
          <p className="text-sm text-slate-600">読み込み中…</p>
        ) : (
          <EmptyState title="スコアがまだありません" description="成果物提出後に評価が表示されます。" />
        )}
      </Card>
    </main>
  );
}
