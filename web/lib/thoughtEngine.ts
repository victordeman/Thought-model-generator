import betterSqlite3 from 'better-sqlite3';

export function normalizeThought(
  rawPayload: string,
  channel: string,
  isError: boolean,
  resultStr?: string
): string {
  let cleaned = rawPayload.replace(/\s+/g, ' ').trim();
  if (!cleaned) {
    cleaned = '(empty interaction)';
  }

  if (isError || channel === 'error') {
    const errText = resultStr ? resultStr.split('\n')[0] : 'execution failed';
    return `ERROR: ${cleaned} -> ${errText}`;
  }

  if (channel === 'hint') {
    return `HINT REQUEST: ${cleaned}`;
  }

  if (channel === 'choice') {
    return `SCENE CHOICE: ${cleaned}`;
  }

  if (/^CREATE\s+TABLE/i.test(cleaned)) {
    return `Declare Schema: ${cleaned}`;
  } else if (/^INSERT\s+INTO/i.test(cleaned)) {
    return `Insert Data: ${cleaned}`;
  } else if (/^SELECT/i.test(cleaned)) {
    return `Query Verification: ${cleaned}`;
  } else if (/^ALTER\s+TABLE/i.test(cleaned)) {
    return `Schema Modification: ${cleaned}`;
  } else if (/^DROP\s+TABLE/i.test(cleaned)) {
    return `Schema Drop: ${cleaned}`;
  }

  return cleaned;
}

export interface SqlQueryDumpRow {
  user_id: string;
  group_id?: string;
  query: string;
  failed: number;
  result?: string;
  date: string;
}

export function interactionsFromQueryRows(rows: SqlQueryDumpRow[], sessionId: string, sceneId: string) {
  return rows.map((row, idx) => {
    const isError = row.failed === 1;
    const channel = isError ? 'error' : 'submit';
    const derivedThought = normalizeThought(row.query, channel, isError, row.result);

    return {
      id: `imported-${idx}-${Date.now()}`,
      at: row.date || new Date().toISOString(),
      sessionId,
      learnerId: row.user_id,
      sceneId,
      channel,
      payload: row.query,
      result: row.result,
      derivedThought
    };
  });
}

const sessionDbMap = new Map<string, betterSqlite3.Database>();

export function getSessionDatabase(sessionId: string): betterSqlite3.Database {
  if (!sessionDbMap.has(sessionId)) {
    const db = new betterSqlite3(':memory:');
    sessionDbMap.set(sessionId, db);
  }
  return sessionDbMap.get(sessionId)!;
}

export function executeSessionSql(sessionId: string, sql: string) {
  const db = getSessionDatabase(sessionId);
  const trimmed = sql.trim();
  if (!trimmed) {
    return { success: true, result: 'Empty query executed.', rows: [] };
  }

  try {
    if (/^SELECT|PRAGMA|EXPLAIN/i.test(trimmed)) {
      const stmt = db.prepare(trimmed);
      const rows = stmt.all();
      return { success: true, result: JSON.stringify(rows, null, 2), rows };
    } else {
      const stmt = db.prepare(trimmed);
      const info = stmt.run();
      return {
        success: true,
        result: `Query OK. Changes: ${info.changes}, LastInsertRowid: ${info.lastInsertRowid}`,
        rows: []
      };
    }
  } catch (err: any) {
    return {
      success: false,
      result: err.message || 'SQLite Execution Error',
      rows: []
    };
  }
}
