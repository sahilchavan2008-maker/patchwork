import { NextRequest, NextResponse } from 'next/server';
import { RawReport, BugAnalysis, MissingQuestion } from '@/types/bug';

export async function POST(request: NextRequest) {
  try {
    const body: RawReport = await request.json();
    const rawText = body.rawText ? body.rawText.trim() : '';

    if (!rawText) {
      return NextResponse.json(
        { error: 'rawText is required to perform bug analysis.' },
        { status: 400 }
      );
    }

    const lower = rawText.toLowerCase();

    // 1. Extract Knowns based on heuristic detection
    const knowns: string[] = [];

    if (lower.includes('checkout') || lower.includes('payment') || lower.includes('cart') || lower.includes('order')) {
      knowns.push('Domain: Checkout & E-Commerce Transaction');
    }
    if (lower.includes('tab') || lower.includes('concurrent') || lower.includes('parallel')) {
      knowns.push('Pattern: Multi-tab concurrency or race condition');
    }
    if (lower.includes('session') || lower.includes('auth') || lower.includes('token') || lower.includes('login') || lower.includes('cookie') || lower.includes('401')) {
      knowns.push('Subsystem: Auth token state & session lifetime');
    }
    if (lower.includes('crash') || lower.includes('exception') || lower.includes('error') || lower.includes('fail')) {
      knowns.push('Impact: Fatal execution failure or state invalidation');
    }
    if (lower.includes('mobile') || lower.includes('ios') || lower.includes('android')) {
      knowns.push('Client Type: Mobile viewport / native shell');
    }
    if (body.attachmentName) {
      knowns.push(`Attachment Provided: ${body.attachmentName} (${body.attachmentType || 'file'})`);
    }

    if (knowns.length === 0) {
      knowns.push('Input Type: General unstructured user bug description');
      knowns.push('Source: Direct user triage intake');
    }

    // 2. Derive dynamic Missing Questions to resolve ambiguity
    const missingQuestions: MissingQuestion[] = [];

    // Question 1: Payment gateway or sub-service identification
    if (lower.includes('payment') || lower.includes('checkout') || lower.includes('stripe')) {
      missingQuestions.push({
        id: 'q-gateway',
        question: 'Which payment provider or gateway endpoint was invoked during the transaction?',
        category: 'payment_gateway',
        placeholder: 'e.g., Stripe PaymentIntent, PayPal Orders API, Apple Pay',
      });
    } else {
      missingQuestions.push({
        id: 'q-component',
        question: 'Which specific component or page route triggered this behavior?',
        category: 'component',
        placeholder: 'e.g., /dashboard/billing, UserProfileModal, SearchFilter',
      });
    }

    // Question 2: Device / Client environment specifics
    missingQuestions.push({
      id: 'q-environment',
      question: 'What client OS and browser version did the reporter observe this on?',
      category: 'device_os',
      placeholder: 'e.g., macOS Sonoma (Chrome 130), Windows 11 (Firefox 131), iOS 18 Safari',
    });

    // Question 3: Recovery action or user state
    if (lower.includes('login') || lower.includes('session') || lower.includes('logout') || lower.includes('redirect')) {
      missingQuestions.push({
        id: 'q-recovery',
        question: 'Did hard-refreshing (Cmd+Shift+R) restore the session state or did it force complete re-authentication?',
        category: 'recovery_action',
        placeholder: 'e.g., Forced re-login with empty cart; or cookie was intact after refresh',
      });
    } else {
      missingQuestions.push({
        id: 'q-frequency',
        question: 'Does this issue occur on every attempt or only under intermittent high network latency?',
        category: 'frequency',
        placeholder: 'e.g., Always reproducible on clean cache, or intermittent 1 in 5 times',
      });
    }

    // 3. Synthesize initial structured reproduction steps
    const reproductionSteps: string[] = [];

    if (lower.includes('tab') && (lower.includes('checkout') || lower.includes('payment'))) {
      reproductionSteps.push('Open the application checkout page with active items in cart on Tab 1.');
      reproductionSteps.push('Duplicate the checkout page into Tab 2 in the same browser profile.');
      reproductionSteps.push('Initiate payment verification or token renewal on Tab 2.');
      reproductionSteps.push('Switch to Tab 1 and submit payment confirmation concurrently.');
      reproductionSteps.push('Observe that Tab 1 rejects the request and invalidates the active session.');
    } else {
      // General parsed steps
      reproductionSteps.push('Log in and navigate to the affected view with standard permissions.');
      reproductionSteps.push(`Perform primary trigger action: "${rawText.slice(0, 75)}..."`);
      reproductionSteps.push('Inspect network panel and application console for emitted errors.');
      reproductionSteps.push('Observe divergence between client state and server persistence.');
    }

    // 4. Extract expected vs actual behavior
    let expectedResult = 'The system handles the user operation idempotently without session degradation or unhandled errors.';
    let actualResult = 'The operation failed unexpectedly, causing unhandled state eviction or error prompts.';

    if (lower.includes('should') || lower.includes('expect')) {
      expectedResult = 'Expected seamless completion of user workflow with atomic state consistency.';
    }

    if (lower.includes('logout') || lower.includes('logged out') || lower.includes('401')) {
      actualResult = 'User authentication token was invalidated prematurely, triggering a redirect to /login.';
    } else if (lower.includes('crash') || lower.includes('white screen') || lower.includes('blank')) {
      actualResult = 'Application entered unhandled error boundary resulting in client blank screen.';
    } else {
      actualResult = `Observed unexpected behavior: ${rawText.slice(0, 120)}`;
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
        browser: lower.includes('chrome') ? 'Google Chrome 130+' : lower.includes('safari') ? 'Safari 18+' : 'Any Chromium / WebKit',
        os: lower.includes('mac') ? 'macOS' : lower.includes('windows') ? 'Windows 11' : 'Cross-platform',
        appVersion: 'v2.14-current',
      },
      severity: lower.includes('critical') || lower.includes('crash') || lower.includes('security') ? 'critical' : 'high',
      confidenceScore: 0.91,
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
