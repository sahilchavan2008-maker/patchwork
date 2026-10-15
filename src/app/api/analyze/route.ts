import { NextRequest, NextResponse } from 'next/server';
import { RawReport, BugAnalysis, MissingQuestion } from '@/types/bug';

/**
 * Real AI Bug Analysis via Google Gemini API
 */
async function analyzeWithGemini(rawText: string, attachmentInfo?: string): Promise<BugAnalysis | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const prompt = `You are a Principal Software Reliability Engineer and Lead QA Architect for "Patchwork", an AI incident triage and ambiguity resolution engine.
Your task is to analyze the following unstructured bug report, customer escalation, stack trace, or network log:

"""
${rawText}
${attachmentInfo ? `\nAttachment Context: ${attachmentInfo}` : ''}
"""

Triage this incident rigorously:
1. Deconstruct the underlying failure mode (e.g., race conditions, token refresh collisions, popstate/history drift, CORS preflight failures, memory leaks, 3DS payment dropout, cache desynchronization, unhandled promise rejections).
2. Extract all established technical facts into "knowns" (4 to 6 items).
3. Formulate 3 surgical, highly specific "missingQuestions" categorized by root cause area ("payment_gateway", "auth_state", "network_transport", "device_os", "recovery_action", "component", "concurrency_timing") with realistic placeholders.
4. Construct a clear, chronological, deterministic reproduction step plan (4 to 6 steps) with exact test actions and verification checkpoints.
5. Define the strict idempotent Expected Result vs the degraded Actual Result.
6. Deduce the client Environment and assign a calibrated Severity ("critical" for data/revenue loss or complete deadlock, "high" for major feature breakdown, "medium" for degraded UX, "low" for visual glitch).

Return ONLY a valid JSON object matching this schema (no markdown fences, no explanatory text):
{
  "summary": "Technical, precise 1-2 sentence description of the incident",
  "knowns": [
    "Domain / subsystem affected",
    "Underlying failure pattern or protocol state",
    "Observed symptoms and error codes",
    "Concurrency or state lifecycle implication"
  ],
  "missingQuestions": [
    {
      "id": "q1",
      "question": "Specific question targeting the primary ambiguity",
      "category": "payment_gateway",
      "placeholder": "Helpful, realistic example answer"
    },
    {
      "id": "q2",
      "question": "Second focused question to isolate reproduction edge cases",
      "category": "device_os",
      "placeholder": "e.g. Browser or OS details"
    },
    {
      "id": "q3",
      "question": "Third question targeting user recovery, error code, or state integrity",
      "category": "recovery_action",
      "placeholder": "e.g. What occurred upon refresh"
    }
  ],
  "reproductionSteps": [
    "1. Arrange: ...",
    "2. Act: ...",
    "3. Trigger: ...",
    "4. Assert: ...",
    "5. Verify: ..."
  ],
  "expectedResult": "Precise idempotent system behavior with status codes and state integrity",
  "actualResult": "Observed failure state, deadlocks, error logs, or UI freeze",
  "environment": {
    "browser": "Inferred browser (e.g. Chrome 130+, Safari 18+)",
    "os": "Inferred OS (e.g. macOS Sequoia, Windows 11)",
    "appVersion": "v2.14-current",
    "runtime": "Next.js / Node.js"
  },
  "severity": "critical",
  "confidenceScore": 0.96
}`;

  // Try current active models with high-throughput priority
  const models = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.1-flash-lite'];

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.15,
            },
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timer);

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        console.warn(`[Gemini API] ${model} returned ${res.status}:`, errJson?.error?.message || res.statusText);
        continue;
      }

      const data = await res.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      const textPart = parts.find((p: { text?: string; thought?: boolean }) => p.text && !p.thought)?.text || parts[0]?.text;
      if (!textPart) continue;

      const cleaned = textPart.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      console.log(`[Gemini API] Successfully triaged incident using model: ${model}`);
      return {
        id: `AI-${Math.floor(1000 + Math.random() * 9000)}`,
        summary: parsed.summary || rawText.slice(0, 120),
        knowns: Array.isArray(parsed.knowns) && parsed.knowns.length > 0
          ? parsed.knowns
          : ['AI-extracted telemetry and context'],
        missingQuestions: Array.isArray(parsed.missingQuestions) && parsed.missingQuestions.length > 0
          ? parsed.missingQuestions
          : [],
        reproductionSteps: Array.isArray(parsed.reproductionSteps) && parsed.reproductionSteps.length > 0
          ? parsed.reproductionSteps
          : [],
        expectedResult: parsed.expectedResult || 'System operates idempotently without session degradation.',
        actualResult: parsed.actualResult || 'Application encountered unhandled deadlock or crash.',
        environment: parsed.environment || {
          browser: 'All Modern Browsers',
          os: 'Cross-platform',
          appVersion: 'v2.14-current',
        },
        severity: parsed.severity || 'high',
        confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.95,
        aiPowered: true,
        aiModel: `Google Gemini (${model})`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Gemini API] Attempt failed on ${model}:`, msg);
    }
  }

  return null;
}

import { checkRateLimit } from '@/lib/rate-limit';
import { sanitizeBugInput } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    // 0. Extract Client IP and Enforce Rate Limiting (Prevent API abuse / Wallet drainage)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
    
    const rateCheck = checkRateLimit(clientIp, 10, 60 * 1000); // 10 requests per minute
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Too many analysis requests from your IP. Please wait a minute before trying again.',
          reset: rateCheck.reset,
        },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': String(rateCheck.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateCheck.reset),
          },
        }
      );
    }

    const body: RawReport = await request.json();
    let rawText = body.rawText ? body.rawText.trim() : '';

    // If rawText is blank but an attachment is present, formulate analysis context from the artifact
    if (!rawText && body.attachmentName) {
      if (body.attachmentType === 'har' || body.attachmentName.toLowerCase().endsWith('.har')) {
        rawText = `Analysis of attached network trace ${body.attachmentName}: Inspecting client-server HTTP transactions, payload mutations, and failed status responses.`;
      } else if (body.attachmentType === 'log' || body.attachmentName.toLowerCase().endsWith('.log')) {
        rawText = `Analysis of attached server/client log dump ${body.attachmentName}: Examining stack traces, uncaught exceptions, and error severity.`;
      } else {
        rawText = `Analysis of attached diagnostic artifact ${body.attachmentName} (${body.attachmentType || 'file'}).`;
      }
    }

    if (!rawText) {
      return NextResponse.json(
        { error: 'Please enter a bug description or drop a log/screenshot attachment to proceed with analysis.' },
        { status: 400 }
      );
    }

    // 1. Sanitize Input & Defend against Prompt Injection
    const sanitization = sanitizeBugInput(rawText);
    if (!sanitization.isValid) {
      return NextResponse.json(
        { error: sanitization.threatDetected || 'Invalid payload rejected by security filter.' },
        { status: 400 }
      );
    }
    rawText = sanitization.sanitizedText;

    const attachmentContext = body.attachmentName
      ? `Filename: ${body.attachmentName}, Type: ${body.attachmentType || 'file'}, Size: ${body.attachmentSize || 'unspecified'}`
      : undefined;

    // 1. ATTEMPT REAL AI TRIAGE FIRST (Google Gemini)
    const geminiResult = await analyzeWithGemini(rawText, attachmentContext);
    if (geminiResult) {
      return NextResponse.json(geminiResult);
    }

    // 2. HEURISTIC FALLBACK (Deterministic engine if Gemini free tier hits 503 or offline)
    const lower = rawText.toLowerCase();
    const attachLower = (body.attachmentName || '').toLowerCase();

    const knowns: string[] = [];

    // --- HEURISTIC TAXONOMY IDENTIFICATION ---
    const isCorsBug = lower.includes('cors') || lower.includes('preflight') || lower.includes('access-control') || lower.includes('cross-origin') || lower.includes('options 403');
    const isAuthRaceBug = lower.includes('401') || lower.includes('jwt') || lower.includes('token expired') || lower.includes('refresh token') || lower.includes('bearer') || lower.includes('session expired') || lower.includes('token rotation') || lower.includes('unauthorized');
    const isPaymentBug = lower.includes('checkout') || lower.includes('payment') || lower.includes('cart') || lower.includes('stripe') || lower.includes('3ds') || lower.includes('paymentintent') || lower.includes('order');
    const isNavigationDeadlock = lower.includes('back') || lower.includes('history') || lower.includes('navigation') || lower.includes('popstate') || lower.includes('bfcache');
    const isFreezeBug = lower.includes('stuck') || lower.includes('freeze') || lower.includes('frozen') || lower.includes('hang') || lower.includes('spinner') || lower.includes('deadlock');
    const isMemoryLeakBug = lower.includes('maximum update depth') || lower.includes('infinite loop') || lower.includes('out of memory') || lower.includes('heap') || lower.includes('leak') || lower.includes('render loop') || lower.includes('unresponsive');
    const isGatewayTimeoutBug = lower.includes('504') || lower.includes('502') || lower.includes('503') || lower.includes('gateway timeout') || lower.includes('bad gateway') || lower.includes('econnreset') || lower.includes('timeout') || lower.includes('econnrefused');
    const isHydrationBug = lower.includes('hydration') || lower.includes('minified react error') || lower.includes('text content does not match') || lower.includes('ssr');
    const isMultiTabBug = lower.includes('tab') || lower.includes('concurrent') || lower.includes('parallel') || lower.includes('multi-tab');

    // Categorized Knowns
    if (isCorsBug) {
      knowns.push('Security Policy: Cross-Origin Resource Sharing (CORS) preflight rejection');
      knowns.push('HTTP Protocol: Preflight OPTIONS handshake terminated with non-2xx status code');
      knowns.push('Network Boundary: Browser security sandbox blocked access to response payload');
    }
    if (isAuthRaceBug) {
      knowns.push('Subsystem: Auth token state & session lifetime');
      knowns.push('Concurrency: In-flight API requests racing with refresh token rotation nonce');
    }
    if (isPaymentBug) {
      knowns.push('Domain: Checkout & Payment Transaction Gateway (3D Secure / PaymentIntent)');
    }
    if (isNavigationDeadlock) {
      knowns.push('Navigation: Browser History Popstate / bfcache state desynchronization');
    }
    if (isFreezeBug) {
      knowns.push('Symptom: Client UI Deadlock / Unhandled Pending State Machine');
    }
    if (isMemoryLeakBug) {
      knowns.push('Performance: Unbounded React re-render cascade / memory heap saturation');
    }
    if (isGatewayTimeoutBug) {
      knowns.push('Infrastructure: Upstream reverse proxy gateway timeout (502/504) or dropped TCP connection');
    }
    if (isHydrationBug) {
      knowns.push('Framework: React SSR Hydration mismatch between server HTML and client VDOM');
    }
    if (isMultiTabBug) {
      knowns.push('Concurrency: Cross-tab state desynchronization without BroadcastChannel mutex');
    }
    if (lower.includes('mobile') || lower.includes('ios') || lower.includes('safari') || lower.includes('android')) {
      knowns.push('Client Type: Mobile WebKit / Hardware gesture navigation');
    }

    // Attachment specific knowns
    if (body.attachmentName) {
      const typeLabel = body.attachmentType || 'file';
      knowns.push(`Attachment: ${body.attachmentName} (${typeLabel}${body.attachmentSize ? ` - ${body.attachmentSize}` : ''})`);

      if (attachLower.includes('.har') || body.attachmentType === 'har') {
        knowns.push('Network Telemetry: HAR capture attached (contains HTTP headers, request timings & status codes)');
      }
      if (attachLower.includes('.log') || body.attachmentType === 'log') {
        knowns.push('Diagnostic Logs: Stack trace file attached with execution timestamps');
      }
    }

    if (knowns.length === 0) {
      knowns.push('Input Type: General unstructured user bug description');
      knowns.push('Source: Direct user triage intake');
    }

    // Dynamic Missing Questions
    const missingQuestions: MissingQuestion[] = [];

    if (isCorsBug) {
      missingQuestions.push({
        id: 'q-cors-origin',
        question: 'Does the backend API whitelist the exact calling origin, including scheme and port?',
        category: 'network',
        placeholder: 'e.g., Access-Control-Allow-Origin: https://app.example.com with credentials: true',
      });
      missingQuestions.push({
        id: 'q-cors-headers',
        question: 'Which custom headers (e.g. X-Authorization, Trace-ID) are sent that require Access-Control-Allow-Headers?',
        category: 'network',
        placeholder: 'e.g., Authorization, X-Requested-With, Content-Type',
      });
      missingQuestions.push({
        id: 'q-cors-environment',
        question: 'Does this failure occur only in local development proxying or in staging/production CDN?',
        category: 'device_os',
        placeholder: 'e.g., Localhost port 3000 to API port 8080 via Cloudflare tunnel',
      });
    } else if (isAuthRaceBug) {
      missingQuestions.push({
        id: 'q-token-storage',
        question: 'How are session and refresh tokens stored and synchronized across tabs?',
        category: 'auth_state',
        placeholder: 'e.g., Secure HttpOnly Cookie with Web Locks API, or localStorage event listener',
      });
      missingQuestions.push({
        id: 'q-token-grace',
        question: 'Does the auth server enforce strict single-use refresh token rotation with zero grace window?',
        category: 'recovery_action',
        placeholder: 'e.g., 0ms grace period revoking all tokens upon parallel refresh',
      });
      missingQuestions.push({
        id: 'q-token-recovery',
        question: 'What is the user recovery path upon receiving 401 — silent retry or immediate redirect to /login?',
        category: 'recovery_action',
        placeholder: 'e.g., Immediate redirect causing cart and form data loss',
      });
    } else if (isMemoryLeakBug) {
      missingQuestions.push({
        id: 'q-render-trigger',
        question: 'Which state hook or external store subscription triggers the continuous re-render loop?',
        category: 'component',
        placeholder: 'e.g., useEffect dependency on unmemoized object literal in useCartStore',
      });
      missingQuestions.push({
        id: 'q-memory-threshold',
        question: 'Does the browser tab crash with an Out of Memory error or show an "Unresponsive Page" dialog?',
        category: 'device_os',
        placeholder: 'e.g., Chrome tab crashes with "Aw, Snap! Error code: 5" after 20 seconds',
      });
      missingQuestions.push({
        id: 'q-cleanup-function',
        question: 'Are WebSocket, resize, or setInterval listeners properly disposed in component unmount?',
        category: 'component',
        placeholder: 'e.g., Missing useEffect return cleanup callback',
      });
    } else if (isGatewayTimeoutBug) {
      missingQuestions.push({
        id: 'q-proxy-timeout',
        question: 'What is the reverse proxy / ingress timeout threshold before 504 is triggered?',
        category: 'network',
        placeholder: 'e.g., NGINX proxy_read_timeout 60s, or Cloudflare 100s edge timeout',
      });
      missingQuestions.push({
        id: 'q-idempotency',
        question: 'Is the timed-out request idempotent, or did the database transaction complete in the background?',
        category: 'recovery_action',
        placeholder: 'e.g., Order recorded in database, but HTTP response timed out at load balancer',
      });
      missingQuestions.push({
        id: 'q-retry-behavior',
        question: 'Does the frontend automatically retry failed mutating POST requests, risking duplicate mutations?',
        category: 'recovery_action',
        placeholder: 'e.g., SWR auto-retry sending duplicate charge requests',
      });
    } else if (isHydrationBug) {
      missingQuestions.push({
        id: 'q-hydration-node',
        question: 'Which specific DOM node or component threw the hydration mismatch warning in the console?',
        category: 'component',
        placeholder: 'e.g., <time> element rendering formatted date using client locale vs UTC server',
      });
      missingQuestions.push({
        id: 'q-ssr-guards',
        question: 'Does the component access window, localStorage, or navigator without a mounted/useEffect check?',
        category: 'component',
        placeholder: 'e.g., Direct window.matchMedia check in component render body',
      });
      missingQuestions.push({
        id: 'q-browser-extensions',
        question: 'Could browser extensions (e.g. password managers, translators) be injecting DOM nodes before hydration?',
        category: 'device_os',
        placeholder: 'e.g., Reproducible in Incognito mode with all extensions disabled',
      });
    } else if (isPaymentBug || isNavigationDeadlock) {
      missingQuestions.push({
        id: 'q-gateway',
        question: 'Which payment provider and flow was active (e.g. Stripe 3DS popup, PayPal redirect, or Apple Pay)?',
        category: 'payment_gateway',
        placeholder: 'e.g., Stripe PaymentIntent with 3D Secure modal redirect',
      });
      missingQuestions.push({
        id: 'q-nav-trigger',
        question: 'How was the back action triggered, and on what device/browser?',
        category: 'device_os',
        placeholder: 'e.g., Browser back button on Chrome 130 (macOS); or iOS swipe back gesture',
      });
      missingQuestions.push({
        id: 'q-recovery-charge',
        question: 'Was the transaction actually completed at the bank/backend or remained pending?',
        category: 'recovery_action',
        placeholder: 'e.g., Order charge succeeded in Stripe, but frontend was stuck on spinner',
      });
    } else {
      missingQuestions.push({
        id: 'q-component',
        question: 'Which specific component or page route triggered this behavior?',
        category: 'component',
        placeholder: 'e.g., /dashboard/billing, UserProfileModal, SearchFilter',
      });
      missingQuestions.push({
        id: 'q-environment',
        question: 'What client OS and browser version was used?',
        category: 'device_os',
        placeholder: 'e.g., macOS Sonoma (Chrome 130), Windows 11 (Firefox 131)',
      });
      missingQuestions.push({
        id: 'q-frequency',
        question: 'Does this issue occur on every attempt or only under high network latency?',
        category: 'recovery_action',
        placeholder: 'e.g., Always reproducible on clean cache, or intermittent',
      });
    }

    // Reconstructed reproduction steps
    const reproductionSteps: string[] = [];

    if (isCorsBug) {
      reproductionSteps.push('Configure client to dispatch an authenticated cross-origin fetch request with custom headers.');
      reproductionSteps.push('Observe browser automatically emitting preflight HTTP OPTIONS request to target endpoint.');
      reproductionSteps.push('Inspect server response headers for missing "Access-Control-Allow-Origin" or "Access-Control-Allow-Credentials".');
      reproductionSteps.push('Verify that browser blocks subsequent GET/POST request and triggers unhandled reject in network client.');
      reproductionSteps.push('Confirm UI displays generic network failure instead of actionable connectivity alert.');
    } else if (isAuthRaceBug) {
      reproductionSteps.push('Open the application with an authenticated session on two separate browser tabs (Tab A & Tab B).');
      reproductionSteps.push('Wait for access token expiration threshold (or simulate 401 response).');
      reproductionSteps.push('Simultaneously trigger API mutations in both tabs within a 200ms window.');
      reproductionSteps.push('Observe Tab A rotating the refresh token and updating its session nonce.');
      reproductionSteps.push('Observe Tab B presenting the retired refresh token, triggering server security alarm.');
      reproductionSteps.push('Verify server immediately invalidates user session family, logging out both tabs with unsaved data loss.');
    } else if (isMemoryLeakBug) {
      reproductionSteps.push('Navigate to the affected route with DevTools Performance & Memory panels active.');
      reproductionSteps.push('Trigger the primary state update action repeatedly (e.g., filtering or rapidly toggling modals).');
      reproductionSteps.push('Take consecutive Heap Snapshots and compare retained JS heap memory.');
      reproductionSteps.push('Observe detached DOM trees and unmemoized effect closures accumulating unbounded memory.');
      reproductionSteps.push('Verify main thread frame rate drops to <5 FPS until the tab becomes completely unresponsive.');
    } else if (isGatewayTimeoutBug) {
      reproductionSteps.push('Dispatch a long-running data processing request from the client UI.');
      reproductionSteps.push('Simulate downstream backend processing latency exceeding the reverse proxy timeout threshold (e.g. 60s).');
      reproductionSteps.push('Observe reverse proxy terminating the HTTP connection with 504 Gateway Timeout.');
      reproductionSteps.push('Verify client application fails to parse proxy response and remains locked in indeterminate loading state.');
    } else if (isHydrationBug) {
      reproductionSteps.push('Initiate a fresh page visit via direct URL entry (cold server-side render).');
      reproductionSteps.push('Inspect server-rendered HTML payload delivered to browser before script execution.');
      reproductionSteps.push('Allow client hydration bundle to execute and attach React synthetic event listeners.');
      reproductionSteps.push('Observe React console error: "Hydration failed because the initial UI does not match what was rendered on the server."');
      reproductionSteps.push('Verify React falls back to client re-render, creating noticeable layout shift and broken interactive listeners.');
    } else if (isNavigationDeadlock || (lower.includes('back') && isPaymentBug)) {
      reproductionSteps.push('Navigate to /checkout with items in the cart and proceed to payment review.');
      reproductionSteps.push('Enter test payment credentials and initiate payment intent processing.');
      reproductionSteps.push('Immediately after payment intent resolves (or during redirect), press the Browser Back button.');
      reproductionSteps.push('Observe that the page enters an unrecoverable frozen spinner with disabled buttons.');
      reproductionSteps.push('Verify that window.history state lacks an idempotent recovery guard for post-payment routing.');
    } else if (body.attachmentType === 'har' || attachLower.includes('.har')) {
      reproductionSteps.push('Load the application environment matching the captured HAR trace.');
      reproductionSteps.push('Replay the sequence of HTTP transactions leading up to the failed network call.');
      reproductionSteps.push('Check headers for authorization token rotation or missing idempotency nonces.');
      reproductionSteps.push('Verify whether client handles non-200 responses with graceful user messaging.');
    } else if (body.attachmentType === 'log' || attachLower.includes('.log')) {
      reproductionSteps.push('Locate the entry point referenced in the top stack trace frame.');
      reproductionSteps.push('Simulate the triggering input conditions in a local integration environment.');
      reproductionSteps.push('Verify unhandled exception boundary catch and state restoration.');
    } else {
      reproductionSteps.push('Log in and navigate to the affected view with standard permissions.');
      reproductionSteps.push(`Perform primary trigger action: "${rawText.slice(0, 75)}..."`);
      reproductionSteps.push('Inspect network panel and application console for emitted errors.');
      reproductionSteps.push('Observe divergence between client state and server persistence.');
    }

    // Expected vs Actual
    let expectedResult = 'The system handles the user operation idempotently without session degradation or UI freezes.';
    let actualResult = 'The operation failed unexpectedly, causing unhandled state locks or error prompts.';

    if (isCorsBug) {
      expectedResult = 'Reverse proxy and API gateway return 204 No Content for preflight OPTIONS with appropriate Access-Control-Allow-Origin, allowing credentials and headers.';
      actualResult = 'Browser network stack rejects preflight response with CORS policy violation, terminating API call with TypeError: Failed to fetch.';
    } else if (isAuthRaceBug) {
      expectedResult = 'Auth layer grants a 15-second grace window for retired refresh tokens or synchronizes token rotation via Web Locks API across tabs.';
      actualResult = 'Strict single-use token rotation invalidates duplicate nonces instantly, evicting the session cookie and redirecting to /login.';
    } else if (isMemoryLeakBug) {
      expectedResult = 'Components subscribe to stable store selectors and clean up listeners on unmount; heap memory remains bounded under steady-state operation.';
      actualResult = 'Component continuously triggers state re-evaluations exceeding React maximum update depth, locking the main thread and crashing the browser tab.';
    } else if (isGatewayTimeoutBug) {
      expectedResult = 'Client polls background job status or receives WebSocket progress; proxy gateway remains responsive with idempotent retries.';
      actualResult = 'HTTP connection abruptly terminates with 504 Gateway Timeout; UI displays blank screen with unhandled promise rejection.';
    } else if (isHydrationBug) {
      expectedResult = 'Server-rendered HTML matches client initial virtual DOM identically; interactive listeners attach smoothly without layout shifts.';
      actualResult = 'DOM tree mismatch forces React to discard server markup and execute emergency client-side re-render, causing perceptible UI flicker.';
    } else if (isNavigationDeadlock || isPaymentBug) {
      expectedResult = 'Pressing back post-payment should safely route to the order confirmation receipt or show an idempotent status banner without freezing the client UI.';
      actualResult = 'The checkout view enters an infinite loading deadlock; navigation buttons freeze and require a hard page reload.';
    }

    const summary = rawText.length > 120
      ? `${rawText.slice(0, 117)}...`
      : rawText;

    const determinedSeverity: 'critical' | 'high' | 'medium' | 'low' =
      isPaymentBug || isAuthRaceBug || lower.includes('critical') || lower.includes('crash')
        ? 'critical'
        : isCorsBug || isGatewayTimeoutBug || isMemoryLeakBug || isFreezeBug
        ? 'high'
        : isHydrationBug
        ? 'medium'
        : 'medium';

    const analysis: BugAnalysis = {
      id: `ANL-${Math.floor(1000 + Math.random() * 9000)}`,
      summary,
      knowns,
      missingQuestions,
      reproductionSteps,
      expectedResult,
      actualResult,
      environment: {
        browser: lower.includes('safari') ? 'Safari 18+' : lower.includes('firefox') ? 'Firefox 131+' : 'Chrome 130 / Chromium',
        os: lower.includes('mac') ? 'macOS Sequoia' : lower.includes('windows') ? 'Windows 11' : 'macOS / Windows',
        appVersion: 'v2.14-stable',
        runtime: 'Next.js 16 + React 19',
      },
      severity: determinedSeverity,
      confidenceScore: 0.94,
      aiPowered: false,
      aiModel: 'Local Heuristic Engine (Deep Bug Taxonomy)',
    };

    return NextResponse.json(analysis);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown server error during analysis';
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
