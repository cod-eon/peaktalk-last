# Core preparation flow

Status: initial product specification

The first user-facing flow must support one professional preparation case:

1. The user provides material for an initiative, roadmap, or budget defense.
2. PeakTalk identifies weak points and the likely attacks from leadership.
3. The user completes a text-based adversarial simulation. Optional voice input
   may be used to compose an answer, but typed input must always work and
   microphone permission must not be required.
4. PeakTalk produces a Defense Brief containing evidence-based answers and the
   unresolved risks.

Acceptance criteria for future implementations:

- The case has a clear target decision and audience.
- Weak points are connected to material or explicitly marked as assumptions.
- Simulation prompts test adversarial objections rather than generic confidence.
- Voice input, when supported, produces text within the same answer contract;
  denial, unsupported browsers, and transcription errors fall back to typing.
- The final brief is usable immediately before the real conversation.
- Loading, empty, error, and incomplete-input states are explicit.

Questions about changing this observable flow require a product decision file.
