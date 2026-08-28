import { NextResponse } from 'next/server';
import { executeSessionSql, normalizeThought } from '@/lib/thoughtEngine';
import { Interaction } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, learnerId, sceneId, channel, payload, commit } = body;

    let result = '';
    let isError = false;

    if (channel === 'query' || channel === 'submit') {
      const execRes = executeSessionSql(sessionId || 'default-session', payload || '');
      result = execRes.result;
      isError = !execRes.success;
    }

    const derivedThought = normalizeThought(payload || '', channel || 'submit', isError, result);

    const interaction: Interaction = {
      id: `int-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      at: new Date().toISOString(),
      sessionId: sessionId || 'default-session',
      learnerId: learnerId || 'student-opaque',
      sceneId: sceneId || 'scene-1',
      channel: isError ? 'error' : (channel || 'submit'),
      payload: payload || '',
      result,
      derivedThought
    };

    return NextResponse.json({
      success: true,
      interaction,
      isError,
      result
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}
