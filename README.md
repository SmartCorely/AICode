# SAP Consultant OJT Simulator

Next.js + Tailwind 製の学習者向けシミュレータです。Google Apps Script Web App を経由して Google Sheets にデータを保存します。

## 必要要件

- Node.js 18 以上
- npm 9 以上
- Google Apps Script (Web App デプロイ権限あり)
- 既存 Google Sheets: [OJT Simulator Spreadsheet](https://docs.google.com/spreadsheets/d/1GwrLIOczTlxHDA2Q1dZ60QdyVt5SIJpNMhi12CPAeY8/edit?gid=0#gid=0)

## セットアップ

```bash
cp .env.local.example .env.local
# Apps Script を再デプロイした場合は URL を .env.local に記入
npm install
```

## 開発サーバ

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

## ビルド

```bash
npm run build
npm run start
```

## Apps Script

`apps-script/main.gs` を Apps Script プロジェクトにコピーしてデプロイしてください。

- 実行ユーザー: 自分
- アクセス権: 全員（匿名含む）

再デプロイで URL が変わった場合は `.env.local` を更新してください。

## 主な画面

- `/` ダッシュボード: プロジェクト作成、概要確認
- `/project/[projectId]` シーン進行、会話ログ・チケット管理
- `/project/[projectId]/artifacts/[sceneId]` 成果物提出、スコア入力
- `/project/[projectId]/scores` スコア履歴 & 平均チャート

## API 呼び出し順序

1. `saveProject`
2. `saveScene`
3. `appendTurns` (3 件ずつなど分割可)
4. `saveTicket`
5. `saveArtifact` ×3
6. `saveScore`

## トラブルシュート

- 403 等 CORS エラーが発生した場合は、Apps Script デプロイ設定を「全員（匿名含む）」にしているか確認してください。
- `NEXT_PUBLIC_APPSCRIPT_BASE_URL` が未設定の場合、画面右下にエラートーストが表示されます。`.env.local` を確認してください。
