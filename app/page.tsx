'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button, Card, EmptyState, PageHeader, TextArea, TextInput } from '@/components/ui';
import { getProjectSummary, saveProject } from '@/lib/api';
import type { Project, ProjectSummary } from '@/types';
import { useToast } from '@/components/toast';

function createProjectId() {
  return `P-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}`;
}

type DashboardProject = Project & { summary?: ProjectSummary | null };

export default function DashboardPage() {
  const { showToast } = useToast();
  const [industry, setIndustry] = useState('製造');
  const [scope, setScope] = useState('SD受注～請求');
  const [goals, setGoals] = useState('テンプレート導入・会計連携の理解');
  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem('sap-simulator-projects');
    if (cached) {
      setProjects(JSON.parse(cached));
    }
  }, []);

  useEffect(() => {
    if (!projects.length) return;
    localStorage.setItem('sap-simulator-projects', JSON.stringify(projects));
  }, [projects]);

  const refreshSummary = async (project: Project) => {
    try {
      const { summary } = await getProjectSummary(project.project_id);
      setProjects((prev) =>
        prev.map((p) => (p.project_id === project.project_id ? { ...p, summary } : p))
      );
    } catch (error) {
      console.error(error);
      showToast({
        title: 'サマリー取得に失敗しました',
        description: (error as Error).message,
        variant: 'error'
      });
    }
  };

  const handleCreateProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const projectId = createProjectId();
    const newProject: Project = {
      project_id: projectId,
      industry,
      scope,
      goals
    };

    try {
      await saveProject(newProject);
      showToast({
        title: 'プロジェクトを作成しました',
        description: `Project ID: ${projectId}`,
        variant: 'success'
      });
      const enriched: DashboardProject = { ...newProject, summary: null };
      setProjects((prev) => [enriched, ...prev]);
      void refreshSummary(newProject);
    } catch (error) {
      console.error(error);
      showToast({
        title: 'プロジェクト作成に失敗しました',
        description: (error as Error).message,
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10">
      <PageHeader
        title="SAP Consultant OJT Simulator"
        description="プロジェクトを作成して、会議シーンから成果物提出までを通しで練習できます。"
      />

      <Card title="新規プロジェクト作成">
        <form onSubmit={handleCreateProject} className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="業種"
            value={industry}
            onChange={(event) => setIndustry(event.target.value)}
            required
          />
          <TextInput
            label="スコープ"
            value={scope}
            onChange={(event) => setScope(event.target.value)}
            required
          />
          <div className="md:col-span-2">
            <TextArea
              label="ゴール"
              value={goals}
              onChange={(event) => setGoals(event.target.value)}
              rows={3}
              required
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? '作成中…' : 'プロジェクトを作成する'}
            </Button>
          </div>
        </form>
      </Card>

      <Card title="最近のプロジェクト">
        {!projects.length ? (
          <EmptyState
            title="まだプロジェクトがありません"
            description="フォームからプロジェクトを作成すると一覧に表示されます。"
          />
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.project_id}
                className="flex flex-col gap-2 rounded-lg border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {project.project_id} / {project.industry}
                  </p>
                  <p className="text-sm text-slate-600">スコープ: {project.scope}</p>
                  <p className="text-sm text-slate-600">ゴール: {project.goals}</p>
                  <div className="mt-2 text-xs text-slate-500">
                    {project.summary ? (
                      <>
                        <p>
                          最新シーン: {project.summary.latestScene?.scene_id ?? '未開始'}
                          {project.summary.latestScene && ` (${project.summary.latestScene.objective})`}
                        </p>
                        <p>未完了チケット数: {project.summary.openTickets}</p>
                        {project.summary.avgScore ? (
                          <p>
                            平均スコア: 知識 {project.summary.avgScore.knowledge} / 標準判断 {project.summary.avgScore.standard_judgement}
                            / 再現性 {project.summary.avgScore.reproducibility} / コミュニケーション {project.summary.avgScore.comms}
                          </p>
                        ) : (
                          <p>スコア: 未集計</p>
                        )}
                      </>
                    ) : (
                      <button
                        className="text-brand-600 hover:text-brand-700"
                        onClick={() => refreshSummary(project)}
                      >
                        サマリーを取得
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/project/${project.project_id}`} className="text-sm text-brand-600 hover:text-brand-700">
                    シーンへ進む
                  </Link>
                  <Link
                    href={`/project/${project.project_id}/scores`}
                    className="text-sm text-slate-600 hover:text-slate-800"
                  >
                    スコア履歴
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}
