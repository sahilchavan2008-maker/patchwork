import { NextRequest, NextResponse } from 'next/server';
import { RawReport, BugAnalysis, MissingQuestion } from '@/types/bug';

export async function POST(request: NextRequest) {
  try {
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

    const lower = rawText.toLowerCase();
    const attachLower = (body.attachmentName || '').toLowerCase();

    // 1. Extract Knowns based on heuristic detection
    const knowns: string[] = [];

    if (lower.includes('checkout') || lower.includes('payment') || lower.includes('cart') || lower.includes('order')) {
      knowns.push('Domain: Checkout & Payment Transaction Gateway');
    }
    if (lower.includes('back') || lower.includes('history') || lower.includes('navigation') || lower.includes('popstate')) {
      knowns.push('Navigation: Browser History Popstate / Back Navigation');
    }
    if (lower.includes('stuck') || lower.includes('freeze') || lower.includes('frozen') || lower.includes('hang') || lower.includes('spinner')) {
      knowns.push('Symptom: Client UI Deadlock / Unhandled Pending State');
    }
    if (lower.includes('tab') || lower.includes('concurrent') || lower.includes('parallel')) {
      knowns.push('Concurrency: Multi-tab race condition on session nonce');
    }
    if (lower.includes('session') || lower.includes('auth') || lower.includes('token') || lower.includes('login') || lower.includes('cookie') || lower.includes('401')) {
      knowns.push('Subsystem: Auth token state & session lifetime');
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

    // 2. Derive dynamic Missing Questions to resolve ambiguity
    const missingQuestions: MissingQuestion[] = [];

    // Question 1: Payment gateway & verification flow
    if (lower.includes('payment') || lower.includes('checkout') || attachLower.includes('checkout')) {
      missingQuestions.push({
        id: 'q-gateway',
        question: 'Which payment provider and flow was active (e.g. Stripe 3DS popup, PayPal redirect, or Apple Pay)?',
        category: 'payment_gateway',
        placeholder: 'e.g., Stripe PaymentIntent with 3D Secure modal redirect',
      });
    } else {
      missingQuestions.push({
        id: 'q-component',
        question: 'Which specific component or page route triggered this behavior?',
        category: 'component',
        placeholder: 'e.g., /dashboard/billing, UserProfileModal, SearchFilter',
      });
    }

    // Question 2: Navigation mechanism and client environment
    if (lower.includes('back') || lower.includes('stuck') || lower.includes('freeze')) {
      missingQuestions.push({
        id: 'q-nav-trigger',
        question: 'How was the back action triggered, and on what device/browser?',
        category: 'device_os',
        placeholder: 'e.g., Browser back button on Chrome 130 (macOS); or iOS swipe back gesture',
      });
    } else {
      missingQuestions.push({
        id: 'q-environment',
        question: 'What client OS and browser version was used?',
        category: 'device_os',
        placeholder: 'e.g., macOS Sonoma (Chrome 130), Windows 11 (Firefox 131)',
      });
    }

    // Question 3: Financial state / recovery behavior
    if (lower.includes('payment') || lower.includes('stuck') || lower.includes('har')) {
      missingQuestions.push({
        id: 'q-recovery-charge',
        question: 'Was the transaction actually completed at the bank/backend or remained pending?',
        category: 'recovery_action',
        placeholder: 'e.g., Order charge succeeded in Stripe, but frontend was stuck on spinner',
      });
    } else {
      missingQuestions.push({
        id: 'q-frequency',
        question: 'Does this issue occur on every attempt or only under high network latency?',
        category: 'frequency',
        placeholder: 'e.g., Always reproducible on clean cache, or intermittent',
      });
    }

    // 3. Synthesize initial structured reproduction steps
    const reproductionSteps: string[] = [];

    if (lower.includes('back') && (lower.includes('payment') || lower.includes('checkout') || lower.includes('stuck'))) {
      reproductionSteps.push('Navigate to /checkout with items in the cart and proceed to payment review.');
      reproductionSteps.push('Enter test payment credentials and initiate payment intent processing.');
      reproductionSteps.push('Immediately after payment intent resolves (or during redirect), press the Browser Back button.');
      reproductionSteps.push('Observe that the page enters an unrecoverable frozen spinner with disabled buttons.');
      reproductionSteps.push('Verify that window.history state lacks an idempotent recovery guard for post-payment routing.');
    } else if (lower.includes('tab') && (lower.includes('checkout') || lower.includes('payment'))) {
      reproductionSteps.push('Open the application checkout page with active items in cart on Tab 1.');
      reproductionSteps.push('Duplicate the checkout page into Tab 2 in the same browser profile.');
      reproductionSteps.push('Initiate payment verification or token renewal on Tab 2.');
      reproductionSteps.push('Switch to Tab 1 and submit payment confirmation concurrently.');
      reproductionSteps.push('Observe that Tab 1 rejects the request with 401 and revokes the active session cookie.');
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

    // 4. Extract expected vs actual behavior
    let expectedResult = 'The system handles the user operation idempotently without session degradation or UI freezes.';
    let actualResult = 'The operation failed unexpectedly, causing unhandled state locks or error prompts.';

    if (lower.includes('back') || lower.includes('stuck') || lower.includes('freeze')) {
      expectedResult = 'Pressing back post-payment should safely route to the order confirmation receipt or show an idempotent status banner without freezing the client UI.';
      actualResult = 'The checkout view enters an infinite loading deadlock; navigation buttons freeze and require a hard page reload.';
    } else if (lower.includes('logout') || lower.includes('logged out') || lower.includes('401')) {
      expectedResult = 'Cart checkout handles token refresh idempotently across tabs without logging out.';
      actualResult = 'Authentication token was invalidated prematurely by token rotation race, redirecting to /login.';
    } else if (body.attachmentType === 'har') {
      expectedResult = 'All asynchronous requests in the workflow complete with valid 2xx status codes and state integrity.';
      actualResult = 'Network trace displays unhandled 4xx/5xx status code or premature request termination.';
    }

    // 5. Build summary
    const summary = rawText.length > 120
      ? `${rawText.slice(0, 117)}...`
      : rawText;

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
      severity: lower.includes('payment') || lower.includes('stuck') || lower.includes('critical') ? 'high' : 'medium',
      confidenceScore: 0.93,
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
