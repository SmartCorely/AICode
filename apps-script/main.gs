const SHEET = {
  projects: 'Projects',
  scenes: 'Scenes',
  turns: 'Turns',
  tickets: 'Tickets',
  artifacts: 'Artifacts',
  scores: 'Scores'
};

function _ok(o = {}) {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, ...o })).setMimeType(
    ContentService.MimeType.JSON
  );
}

function _err(m, e = {}) {
  console.error('[ERR]', m, e);
  return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(m), ...e })).setMimeType(
    ContentService.MimeType.JSON
  );
}

function doOptions() {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function _withCORS(r) {
  return r.setHeader('Access-Control-Allow-Origin', '*').setHeader('Vary', 'Origin');
}

function doGet(e) {
  try {
    const p = e.parameter || {};
    const a = p.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (a === 'latestTicket') {
      const pid = p.project_id;
      if (!pid) return _withCORS(_err('project_id required'));
      const sh = ss.getSheetByName(SHEET.tickets);
      const rows = sh.getDataRange().getValues();
      for (let i = rows.length - 1; i >= 1; i--) {
        const r = rows[i];
        if (r[1] === pid && r[4] === 'open') {
          return _withCORS(
            _ok({
              ticket: {
                ticket_id: r[0],
                project_id: r[1],
                category: r[2],
                acceptance_criteria: safeParse(r[3]),
                status: r[4]
              }
            })
          );
        }
      }
      return _withCORS(_ok({ ticket: null }));
    }
    if (a === 'projectSummary') {
      const pid = p.project_id;
      if (!pid) return _withCORS(_err('project_id required'));
      const sum = { latestScene: null, openTickets: 0, avgScore: null };
      const sc = ss.getSheetByName(SHEET.scenes).getDataRange().getValues();
      for (let i = sc.length - 1; i >= 1; i--) {
        if (sc[i][1] === pid) {
          sum.latestScene = { scene_id: sc[i][0], sprint: sc[i][2], objective: sc[i][4] };
          break;
        }
      }
      const tk = ss.getSheetByName(SHEET.tickets).getDataRange().getValues();
      sum.openTickets = tk.slice(1).filter((r) => r[1] === pid && r[4] === 'open').length;
      const scs = ss
        .getSheetByName(SHEET.scores)
        .getDataRange()
        .getValues()
        .slice(1)
        .filter((r) => r[0] && r[0].startsWith('S-'));
      if (scs.length) {
        const avg = (a) => Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 10) / 10;
        sum.avgScore = {
          knowledge: avg(scs.map((r) => +r[1] || 0)),
          standard_judgement: avg(scs.map((r) => +r[2] || 0)),
          reproducibility: avg(scs.map((r) => +r[3] || 0)),
          comms: avg(scs.map((r) => +r[4] || 0))
        };
      }
      return _withCORS(_ok({ summary: sum }));
    }
    if (a === 'listScores') {
      const pid = p.project_id;
      if (!pid) return _withCORS(_err('project_id required'));
      const scenes = ss
        .getSheetByName(SHEET.scenes)
        .getDataRange()
        .getValues()
        .slice(1)
        .filter((r) => r[1] === pid)
        .map((r) => r[0]);
      const scs = ss
        .getSheetByName(SHEET.scores)
        .getDataRange()
        .getValues()
        .slice(1)
        .filter((r) => scenes.includes(r[0]))
        .map((r) => ({
          scene_id: r[0],
          knowledge: +r[1] || 0,
          standard_judgement: +r[2] || 0,
          reproducibility: +r[3] || 0,
          comms: +r[4] || 0,
          feedback: r[5] || '',
          timestamp: r[6] ? new Date(r[6]).toISOString() : ''
        }));
      return _withCORS(_ok({ scores: scs }));
    }
    return _withCORS(_err('Unknown GET action', { action: a }));
  } catch (e2) {
    return _withCORS(_err(e2.message));
  }
}

function doPost(e) {
  try {
    const { action: a, payload: p } = JSON.parse(e.postData.contents || '{}');
    if (!a) return _withCORS(_err('action required'));
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (a === 'saveProject') {
      if (!p.project_id) return _withCORS(_err('project_id required'));
      ss.getSheetByName(SHEET.projects).appendRow([p.project_id, p.industry || '', p.scope || '', p.goals || '', new Date()]);
      console.log('[saveProject]', p.project_id);
      return _withCORS(_ok({ project_id: p.project_id }));
    }
    if (a === 'saveScene') {
      if (!p.scene_id || !p.project_id) return _withCORS(_err('scene_id/project_id required'));
      ss.getSheetByName(SHEET.scenes).appendRow([
        p.scene_id,
        p.project_id,
        p.sprint || '',
        p.type || '',
        p.objective || '',
        new Date()
      ]);
      console.log('[saveScene]', p.scene_id);
      return _withCORS(_ok({ scene_id: p.scene_id }));
    }
    if (a === 'appendTurns') {
      if (!p.scene_id || !Array.isArray(p.turns)) return _withCORS(_err('scene_id/turns required'));
      const sh = ss.getSheetByName(SHEET.turns);
      p.turns.forEach((t) =>
        sh.appendRow([p.scene_id, t.turn_no, t.role, t.utterance, t.timestamp ? new Date(t.timestamp) : new Date()])
      );
      console.log('[appendTurns]', p.scene_id, p.turns.length);
      return _withCORS(_ok({ saved: p.turns.length }));
    }
    if (a === 'saveTicket') {
      if (!p.ticket_id || !p.project_id) return _withCORS(_err('ticket_id/project_id required'));
      ss.getSheetByName(SHEET.tickets).appendRow([
        p.ticket_id,
        p.project_id,
        p.category || '',
        JSON.stringify(p.acceptance_criteria || {}),
        p.status || 'open'
      ]);
      console.log('[saveTicket]', p.ticket_id);
      return _withCORS(_ok({ ticket_id: p.ticket_id }));
    }
    if (a === 'saveArtifact') {
      if (!p.scene_id || !p.type || !p.content) return _withCORS(_err('scene_id/type/content required'));
      ss.getSheetByName(SHEET.artifacts).appendRow([`A-${Date.now()}`, p.scene_id, p.type, p.content, p.link || '', new Date()]);
      console.log('[saveArtifact]', p.scene_id, p.type);
      return _withCORS(_ok({ ok: true }));
    }
    if (a === 'saveScore') {
      if (!p.scene_id) return _withCORS(_err('scene_id required'));
      ss.getSheetByName(SHEET.scores).appendRow([
        p.scene_id,
        +p.knowledge || 0,
        +p.standard_judgement || 0,
        +p.reproducibility || 0,
        +p.comms || 0,
        p.feedback || '',
        new Date()
      ]);
      console.log('[saveScore]', p.scene_id);
      return _withCORS(_ok({ ok: true }));
    }
    return _withCORS(_err('Unknown POST action', { action: a }));
  } catch (e2) {
    return _withCORS(_err(e2.message));
  }
}

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch (e) {
    return {};
  }
}
