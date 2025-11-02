'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, PageHeader, TextArea } from '@/components/ui';
import { saveArtifacts, saveScore } from '@/lib/api';
import { useToast } from '@/components/toast';

const minutesTemplate = `目的:\n決定事項:\n未決事項:\nToDo:\n- 担当:\n- 期限:`;
const fitGapTemplate = `要件ID:\n標準/拡張:\n理由:\n影響:`;
const testCaseTemplate = `前提条件:\n手順:\n期待結果:\n実績:\nログ:`;

export default function ArtifactSubmissionPage() {
  const params = useParams<{ id: string; sceneId: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const projectId = params?.id ?? '';
  const sceneId = params?.sceneId ?? '';

  const [minutes, setMinutes] = useState(minutesTemplate);
  const [fitGap, setFitGap] = useState(fitGapTemplate);
  const [testCase, setTestCase] = useState(testCaseTemplate);
  const [knowledge, setKnowledge] = useState(3);
  const [standardJudgement, setStandardJudgement] = useState(3);
  const [reproducibility, setReproducibility] = useState(3);
  const [comms, setComms] = useState(3);
  const [feedback, setFeedback] = useState('次回はヒアリングの深掘りと業務影響を明確化しましょう。');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await saveArtifacts(sceneId, [
        { scene_id: sceneId, type: 'Minutes', content: minutes },
        { scene_id: sceneId, type: 'FitGap', content: fitGap },
        { scene_id: sceneId, type: 'TestCase', content: testCase }
      ]);
      await saveScore({
        scene_id: sceneId,
        knowledge,
        standard_judgement: standardJudgement,
        reproducibility,
        comms,
        feedback
      });
      showToast({ title: '成果物とスコアを保存しました', variant: 'success' });
      router.push(`/project/${projectId}`);
    } catch (error) {
      console.error(error);
      showToast({
        title: '成果物保存に失敗しました',
        description: (error as Error).message,
        variant: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10">
      <PageHeader
        title={`成果物提出 - Scene ${sceneId}`}
        description="議事録・Fit&Gap・テストケースを提出し、メンターからのスコアを記録します。"
      />

      <Card title="提出フォーム">
        <form onSubmit={handleSubmit} className="space-y-6">
          <TextArea label="Minutes" value={minutes} onChange={(e) => setMinutes(e.target.value)} rows={6} required />
          <TextArea label="Fit & Gap" value={fitGap} onChange={(e) => setFitGap(e.target.value)} rows={6} required />
          <TextArea label="Test Case" value={testCase} onChange={(e) => setTestCase(e.target.value)} rows={6} required />

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-700">
              知識
              <input
                type="number"
                min={1}
                max={5}
                value={knowledge}
                onChange={(e) => setKnowledge(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              標準判断
              <input
                type="number"
                min={1}
                max={5}
                value={standardJudgement}
                onChange={(e) => setStandardJudgement(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              再現性
              <input
                type="number"
                min={1}
                max={5}
                value={reproducibility}
                onChange={(e) => setReproducibility(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              コミュニケーション
              <input
                type="number"
                min={1}
                max={5}
                value={comms}
                onChange={(e) => setComms(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </div>

          <TextArea
            label="フィードバック"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? '送信中…' : '成果物を提出する'}
            </Button>
          </div>
        </form>
      </Card>
    </main>
  );
}
