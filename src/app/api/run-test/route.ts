import { NextRequest, NextResponse } from 'next/server';

export interface TerminalLog {
  id: string;
  timestamp: string;
  type: 'cmd' | 'info' | 'warn' | 'error' | 'success';
  message: string;
}

export interface RunTestResponse {
  testId: string;
  testType: 'playwright' | 'jest';
  mode: 'buggy' | 'patched';
  status: 'passed' | 'failed';
  durationMs: number;
  logs: TerminalLog[];
  exitCode: number;
  assertionError?: {
    expected: string;
    actual: string;
    location: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mode = body.mode === 'patched' ? 'patched' : 'buggy';
    const testType = body.testType === 'jest' ? 'jest' : 'playwright';
    const bugTitle = body.bugTitle || 'post-payment navigation deadlock';

    const startTime = Date.now();
    const logs: TerminalLog[] = [];

    const addLog = (type: TerminalLog['type'], message: string) => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
      logs.push({
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: timeStr,
        type,
        message,
      });
    };

    if (testType === 'playwright') {
      addLog('cmd', '$ npx playwright test tests/repro-scenario.spec.ts --project=chromium --reporter=list');
      addLog('info', 'Running 1 test using 1 worker');
      addLog('info', '[chromium] › tests/repro-scenario.spec.ts:8:1 › reproduce: verify post-operation stability');
      addLog('info', '  [step 1] Launching Chromium (Headless Sandbox)... OK (280ms)');
      addLog('info', '  [step 2] page.goto("/checkout") with active session... OK (200 OK)');
      addLog('info', '  [step 3] Intercepting network route: mock network latency 800ms...');
      addLog('info', '  [step 4] page.fill("#card-number", "•••• •••• •••• 4242")');
      addLog('info', '  [step 5] page.click("button[type=\'submit\']")');

      if (mode === 'buggy') {
        addLog('warn', '  [step 6] User rapid second click dispatched or history popstate back triggered...');
        addLog('error', '  [step 7] Assertion failed: UI entered unhandled infinite state');
        addLog(
          'error',
          '    Error: Timed out 3000ms waiting for expect(locator).not.toBeVisible()'
        );
        addLog('error', '    Locator: locator(".payment-infinite-spinner")');
        addLog('error', '    Expected: not visible');
        addLog('error', '    Received: <div class="payment-infinite-spinner"> visible');
        addLog('error', '      at tests/repro-scenario.spec.ts:34:30');
        addLog('error', '      32 |   // Assert: UI must not enter infinite deadlock');
        addLog('error', '      33 |   const freezeSpinner = page.locator(\'.payment-infinite-spinner\');');
        addLog('error', '    > 34 |   await expect(freezeSpinner).not.toBeVisible({ timeout: 3000 });');
        addLog('error', '         |                               ^');
        addLog('cmd', '  1 failed');
        addLog('error', '  [FAIL] chromium › tests/repro-scenario.spec.ts:8:1 (3.4s)');

        return NextResponse.json<RunTestResponse>({
          testId: `run_${Date.now()}`,
          testType,
          mode,
          status: 'failed',
          durationMs: 3410,
          exitCode: 1,
          logs,
          assertionError: {
            expected: 'not visible (clean idempotent transition)',
            actual: 'visible (infinite spinner deadlock)',
            location: 'tests/repro-scenario.spec.ts:34:30',
          },
        });
      } else {
        // mode === 'patched'
        addLog('info', '  [step 6] In-flight Mutex lock engaged: isSubmittingRef === true');
        addLog('info', '  [step 7] button.isDisabled() === true (Re-entrancy blocked)');
        addLog('info', '  [step 8] Popstate listener caught back navigation -> Safe redirect to /orders/confirmation');
        addLog('success', '  [step 9] expect(freezeSpinner).not.toBeVisible() passed (4ms)');
        addLog('success', '  [step 10] expect(statusBanner).toBeVisible() passed (12ms)');
        addLog('success', '✓ 1 passed (1.2s)');
        addLog('cmd', '========================= 1 passed in 1.22s =========================');

        return NextResponse.json<RunTestResponse>({
          testId: `run_${Date.now()}`,
          testType,
          mode,
          status: 'passed',
          durationMs: 1220,
          exitCode: 0,
          logs,
        });
      }
    } else {
      // Jest test runner
      addLog('cmd', '$ npm test -- -t "Payment Navigation State Machine"');
      addLog('info', 'PASS src/__tests__/stateMachine.test.ts');
      addLog('info', '  Payment Navigation State Machine & Idempotency');

      if (mode === 'buggy') {
        addLog('error', '    ✕ should prevent deadlock when popstate navigation occurs (48 ms)');
        addLog('error', '      Expected: false, Received: true (isFrozen state was not cleared)');
        addLog('error', '        at src/__tests__/stateMachine.test.ts:21:28');
        addLog('cmd', 'Tests:       1 failed, 1 total');
        addLog('cmd', 'Time:        1.45 s');

        return NextResponse.json<RunTestResponse>({
          testId: `run_${Date.now()}`,
          testType,
          mode,
          status: 'failed',
          durationMs: 1450,
          exitCode: 1,
          logs,
          assertionError: {
            expected: 'false (not frozen)',
            actual: 'true (deadlock active)',
            location: 'src/__tests__/stateMachine.test.ts:21:28',
          },
        });
      } else {
        addLog('success', '    ✓ should prevent deadlock when popstate navigation occurs (12 ms)');
        addLog('success', '    ✓ should maintain auth session cookie without emitting 401 (8 ms)');
        addLog('cmd', 'Tests:       2 passed, 2 total');
        addLog('cmd', 'Snapshots:   0 total');
        addLog('cmd', 'Time:        0.98 s');

        return NextResponse.json<RunTestResponse>({
          testId: `run_${Date.now()}`,
          testType,
          mode,
          status: 'passed',
          durationMs: 980,
          exitCode: 0,
          logs,
        });
      }
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Runner execution error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
