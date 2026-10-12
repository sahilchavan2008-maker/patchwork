import { BugReport } from '@/types/bug-report';
import { AmbiguityAssessment, DeveloperReport } from '@/types/analysis';

export const initialMockBugReport: BugReport = {
  id: 'BUG-8492',
  title: 'Silent Session Loss During Multi-Tab Checkout Submission',
  summary:
    'Users report that when completing payment across two open checkout tabs, the active session cookie is cleared without an error message, redirecting back to the login screen and abandoning the shopping cart.',
  severity: 'high',
  affectedComponent: 'auth/session-sync & checkout/gateway',
  status: 'clarification_needed',
  reproducibility: 'intermittent',
  clarificationRequired: true,
  createdAt: '2026-10-12T19:42:00Z',
  updatedAt: '2026-10-12T20:15:00Z',
  stepsToReproduce: [
    'Open checkout on tab A with items in cart.',
    'Duplicate tab or open same checkout session in tab B.',
    'Initiate Stripe intent confirmation in tab B.',
    'Quickly switch back to tab A and click "Confirm Order".',
    'Session is nuked; both tabs redirect to /login with 401 Unauthorized.',
  ],
  expectedBehavior:
    'Tab A should either gracefully lock with an idempotent conflict notice ("Order processed in another tab") or update its state without evicting the authentication cookie.',
  actualBehavior:
    'Auth cookie is revoked immediately by server token rotation race condition; user is logged out with no recovery state.',
  environment: {
    browser: 'Chrome 130 / Firefox 131',
    os: 'macOS Sequoia & Windows 11',
    appVersion: 'v2.14.0-rc3',
    runtime: 'Node.js 22.x',
  },
  errorLogs: `[2026-10-12 19:41:03] WARN  [AuthService] Refresh token rotation invalidated duplicate nonce: req_8849b
[2026-10-12 19:41:03] ERROR [SessionGuard] Invalid session state for user_9421. Evicting session cookie.
[2026-10-12 19:41:04] INFO  [Telemetry] 401 Unauthorized emitted on /api/v2/checkout/finalize`,
  stackTrace: `Error: SessionNonceMismatchException: Token nonce was reused
    at SessionGuard.verifyToken (server/auth/session-guard.ts:84:13)
    at async CheckoutHandler.processPayment (server/checkout/handler.ts:142:7)
    at async NextServerRoute.handle (server/router.ts:51:19)`,
  tags: ['auth', 'checkout', 'race-condition', 'stripe', 'session-cookie'],
};

export const initialMockAmbiguityAssessment: AmbiguityAssessment = {
  score: 68,
  ambiguityAreas: [
    'Concurrency & Tab Coordination Protocol',
    'Expected Behavior on Nonce Conflict',
    'Cart Idempotency Key Handling',
  ],
  missingContextFactors: [
    'Does the client application share a BroadcastChannel or localStorage event listener across tabs?',
    'Should the backend allow grace period for concurrent in-flight refresh requests?',
  ],
  assessedAt: '2026-10-12T20:15:30Z',
  questions: [
    {
      id: 'AMB-101',
      question:
        'Does the frontend implement cross-tab synchronization (e.g. BroadcastChannel or StorageEvent)?',
      contextExplanation:
        'Without a tab sync coordinator, concurrent checkout tabs race to rotate the single-use JWT refresh token.',
      category: 'concurrency',
      severity: 'high',
      options: [
        {
          id: 'opt-1a',
          label: 'No cross-tab synchronization exists currently',
          description: 'Each tab independently requests token refresh on user action.',
        },
        {
          id: 'opt-1b',
          label: 'BroadcastChannel is present but not configured for checkout mutations',
          description: 'Channel exists only for auth logout events.',
        },
        {
          id: 'opt-1c',
          label: 'Tabs use Web Workers with SharedArrayBuffer',
          description: 'Dedicated worker handles shared networking.',
        },
      ],
      userResponse: 'No cross-tab synchronization exists currently',
      selectedOptionId: 'opt-1a',
      isResolved: true,
      resolvedAt: '2026-10-12T20:20:00Z',
    },
    {
      id: 'AMB-102',
      question:
        'What should happen to Tab A when Tab B completes the payment first?',
      contextExplanation:
        'Determines whether the client should display a soft warning modal or auto-redirect to the existing receipt.',
      category: 'expected_output',
      severity: 'medium',
      options: [
        {
          id: 'opt-2a',
          label: 'Redirect to Order Confirmation & Receipt',
          description: 'Detect idempotency completion and display successful order summary.',
        },
        {
          id: 'opt-2b',
          label: 'Show "Order Already In Progress" warning dialog',
          description: 'Disable checkout buttons and prompt user to refresh tab.',
        },
      ],
      userResponse: 'Redirect to Order Confirmation & Receipt',
      selectedOptionId: 'opt-2a',
      isResolved: true,
      resolvedAt: '2026-10-12T20:22:00Z',
    },
    {
      id: 'AMB-103',
      question:
        'Should the token refresh backend support a 10-second grace window for concurrent requests?',
      contextExplanation:
        'Strict single-use rotation instantly revokes sessions when concurrent requests arrive within milliseconds.',
      category: 'precondition',
      severity: 'high',
      options: [
        {
          id: 'opt-3a',
          label: 'Yes, enable a 10s grace period for recently rotated refresh tokens',
          description: 'Allows in-flight duplicate requests without invalidating session family.',
        },
        {
          id: 'opt-3b',
          label: 'No, enforce strict revocation and handle locking client-side with Mutex',
          description: 'Enforces Web Locks API (navigator.locks) before initiating refresh.',
        },
      ],
      userResponse: '',
      selectedOptionId: undefined,
      isResolved: false,
    },
  ],
};

export const initialMockDeveloperReport: DeveloperReport = {
  id: 'REP-2026-904',
  reportNumber: '#PW-2026-0904',
  bugReportId: 'BUG-8492',
  generatedAt: '2026-10-12T20:25:00Z',
  executiveSummary:
    'Root cause identified as strict Single-Use Refresh Token Rotation without concurrency leeway. When Tab B initiated payment, it consumed the refresh token; Tab A fired an in-flight API check with the superseded token, triggering the security alarm which revoked the active session.',
  severity: 'high',
  confidenceScore: 0.94,
  ambiguityStatus: 'partially_resolved',
  resolvedAmbiguitiesCount: 2,
  totalAmbiguitiesCount: 3,
  impactedComponents: [
    'src/server/auth/session-guard.ts',
    'src/lib/auth/token-manager.ts',
    'src/features/checkout/CheckoutFlow.tsx',
  ],
  regressionRisk: 'low',
  rootCause: {
    id: 'RC-1',
    title: 'Zero-tolerance Token Rotation Race in SessionGuard',
    probabilityScore: 0.94,
    rationale:
      'SessionGuard revokes the entire token family immediately upon detecting any prior nonce, with zero grace window for parallel HTTP requests originating from multiple browser tabs.',
    culpritFile: 'src/server/auth/session-guard.ts',
    culpritFunction: 'verifyTokenAndRotate',
    codeSnippet: `// Vulnerable implementation:
if (storedNonce !== clientNonce) {
  await revokeUserSessions(userId); // NUKES ALL ACTIVE TABS
  throw new SessionNonceMismatchException('Token nonce was reused');
}`,
  },
  verifiedSteps: [
    'Simulate concurrent requests with duplicate refresh token within 400ms.',
    'Observe SessionNonceMismatchException throwing 401.',
    'Confirm cookies "auth_token" and "refresh_token" are set to expired.',
  ],
  reproductionScript: `// scripts/repro-bug-8492.ts
import { test, expect } from '@playwright/test';

test('reproduce multi-tab session revocation race', async ({ browser }) => {
  const context = await browser.newContext();
  const page1 = await context.newPage();
  const page2 = await context.newPage();

  await page1.goto('/checkout');
  await page2.goto('/checkout');

  await Promise.all([
    page1.click('#submit-payment-btn'),
    page2.click('#submit-payment-btn')
  ]);

  // Expected: Idempotent lock, not 401 redirect
  await expect(page1).not.toHaveURL(/\\/login/);
});`,
  suggestedFix: {
    summary:
      'Implement an atomic 15-second grace window in Redis for rotated refresh tokens and utilize the Web Locks API on the frontend client to serialize token renewal.',
    patches: [
      {
        filePath: 'src/server/auth/session-guard.ts',
        originalSnippet: `if (storedNonce !== clientNonce) {
  await revokeUserSessions(userId);
  throw new SessionNonceMismatchException('Token nonce was reused');
}`,
        patchedSnippet: `// Check if the presented nonce was retired within grace window (15s)
const isWithinGracePeriod = await checkRetiredNonceGracePeriod(userId, clientNonce, 15);
if (isWithinGracePeriod) {
  // Return the newly issued active access token instead of killing session
  return await getActiveSessionToken(userId);
}

if (storedNonce !== clientNonce) {
  await revokeUserSessions(userId);
  throw new SessionNonceMismatchException('Potential replay attack detected');
}`,
        explanation:
          'Permits in-flight requests that were dispatched before the new token reached the client to resolve safely.',
      },
    ],
    testingStrategy: [
      'Unit test: SessionGuard allows superseded nonce within 15 seconds.',
      'Unit test: SessionGuard strictly revokes session after 16 seconds.',
      'E2E Playwright test: Multi-tab parallel checkout execution.',
    ],
  },
  developerActionChecklist: [
    {
      id: 'ACT-1',
      task: 'Update Redis token schema to store previousNonce with TTL of 15 seconds',
      completed: false,
    },
    {
      id: 'ACT-2',
      task: 'Introduce Web Locks (navigator.locks.request) in frontend token manager',
      completed: false,
    },
    {
      id: 'ACT-3',
      task: 'Add regression test reproducing concurrent multi-tab payment requests',
      completed: false,
    },
  ],
};
