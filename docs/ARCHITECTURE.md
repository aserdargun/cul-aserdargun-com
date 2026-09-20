# Architecture and scope / Mimari ve kapsam

## State, policy and evidence

- `src/engine/types.ts`: Scenario, TaskGoal, EnvironmentState, Observation, TargetDescriptor, ActionProposal, ActionResult, VerificationResult, Approval, RecoveryPolicy, RunEvent, ExperimentRun.
- `environment/model.ts`: shared Atlas records, filters, ordering, draft, overlays, dialogs, hit rectangles and user mutations.
- `engine/observation.ts`: synthetic projection. Coordinate observations have text/context/bounds, never roles or internal record IDs. Semantic observations have role/name/context, never geometry or record IDs. Stable canonical names are translated only in the UI.
- `engine/strategies.ts`: pure selection receives only observation, public task goal, progress and context-narrowing state. No EnvironmentState, verifier state or hidden answer key.
- `engine/engine.ts`: deterministic transitions and actuator; validates current surface, uniqueness, visibility, enabled/overlay state, scope, observation binding and approval. The coordinate actuator hit-tests the logical point; the semantic actuator resolves the descriptor against the current surface.
- `engine/verifier.ts`: internal environment-state evidence, separately labelled from observed screen evidence. Selection, draft and final persisted state are distinct checks.
- `components/`: lab panels, functioning environment, comparison, read-only trace inspection and Methods.
- `content/`: scenarios, full TR/EN labels/explanations and source provenance.

The synthetic observation includes modeled offscreen elements with `visible: false`, allowing the policy to request bounded scrolling. This is intentionally a scene-model teaching aid, not screenshot parsing or a claim of actual computer vision. The same model defines rendered element bounds and the actuator's hit testing. Actual responsive DOM alignment is tested separately in Chromium.

The semantic strategy re-resolves against the current surface; coordinates reject a version mismatch before acting. Both can fail on ambiguity, missing labels, disabled targets, overlays and scope constraints. Context narrowing uses the group explicitly included in the public task.

The untrusted-text scenario is a fixed fixture, not an injection classifier or an LLM-defense benchmark. It models recognizing that environment text cannot authorize a new operation. Independent engine tests also attempt an unauthorized archive regardless of UI button visibility.

## Loop and lifecycle

Ready → Observing → Targeting → Action ready → [Awaiting approval] → Acting → fresh Observation → Verifying → Observing / Completed.

Failure → Recovering → Observing, up to 3 retries; persistent failure → Handed off. Total budget: 64 synthetic steps. Rejected approval → Blocked. `failed` is an available status for future unrecoverable failures; current bounded failures explicitly hand off.

All engine calls are synchronous and pure at the run boundary (`advance` clones). The UI schedules only the next transition with a cancellable timeout and a captured run ID. Pause removes that timeout. Reset creates a unique new run; `advance(newRun, oldRunId)` is a no-op. There are no in-flight network operations.

History inspection copies event data and never runs the actuator. It does not pretend the live environment is a historical snapshot. Comparison starts two independent runs from equal initial state and equal faults. Runs stop for human approval, including in comparison.

## Approval and scope

Approval is bound to run ID, action ID, internal target identity and exact draft content; it is checked in the actuator and consumed once. Environment interventions invalidate any unused approval. Target/content changes discard the old proposal and require a fresh observation and explicit decision. This conservative invalidation also occurs for harmless environment changes; it is a laboratory design choice.

Read-only navigation needs no approval. Manual edits/saves in Atlas are intentional user interventions, not agent actions. Archive confirmation still goes through the engine approval check. The user cannot use the environment button to bypass approval.

## Coordinates and locale

Logical frame 640 × 480; list top 156; row height 52 (48 interactive); list viewport 276 high. A row is actionable only when completely visible. Hit rectangles and stage positions share logical coordinates. Display scaling uses one CSS transform around the entire stage. Narrow screens scroll only the bounded environment horizontally, keeping full-size readable controls. List scroll offsets are part of observation and environment version.

User data is synthetic. Canonical task labels and stable field keys never change with locale. TR/EN changes presentation without changing run, policy, observation or approval. Freeform notes remain user-entered content and are not translated.

## Export and release

`schemaVersion: "1.0"` exports the complete ExperimentRun: scenario definition, public goal, strategy, fault configuration, initial environment, current environment, events, observations, proposals, action results, verification and approval. `exportNote` describes synthetic provenance. `schemas/experiment-run.schema.json` gives the top-level contract; TypeScript is the detailed in-process contract.

`npm run build` emits static `dist/`, with bundled fonts and no runtime external dependencies. No production deployment, DNS edits, integration with neighbouring projects, telemetry, storage backend or external account access is implemented.
