export type Lang = 'tr' | 'en';
export type Text = { tr: string; en: string };
export type Strategy = 'coordinate' | 'semantic';
export type ScenarioId = 'stable' | 'shift' | 'ambiguous' | 'blocked' | 'uncertain' | 'approval';
export type Status =
  | 'ready'
  | 'observing'
  | 'targeting'
  | 'action-ready'
  | 'awaiting-approval'
  | 'acting'
  | 'verifying'
  | 'recovering'
  | 'completed'
  | 'blocked'
  | 'failed'
  | 'handed-off';
export interface TaskGoal {
  title: string;
  group: string;
  value: string;
  operation: 'edit' | 'archive';
}
export interface RecoveryPolicy {
  maxRetries: number;
  maxSteps: number;
}
export interface Scenario {
  id: ScenarioId;
  title: Text;
  subtitle: Text;
  lesson: Text;
  goal: TaskGoal;
  recovery: RecoveryPolicy;
}
export interface RecordData {
  id: string;
  title: string;
  group: string;
  value: string;
  archived: boolean;
  commits: number;
  archiveCount: number;
}
export interface EnvironmentState {
  version: number;
  records: RecordData[];
  selected: string | null;
  draft: string;
  search: string;
  filter: 'all' | 'active' | 'archived';
  reversed: boolean;
  scroll: number;
  overlay: boolean;
  dialog: boolean;
  disabled: boolean;
  notice: boolean;
  missingLabel: boolean;
  receipt: boolean;
}
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface SurfaceElement {
  key: string;
  role: 'button' | 'textbox';
  name: string;
  context: string;
  rect: Rect;
  enabled: boolean;
  visible: boolean;
  operation: 'open' | 'fill' | 'save' | 'request-archive' | 'archive';
  record?: string;
}
export interface CoordinateElement {
  text: string;
  context: string;
  rect: Rect;
  enabled: boolean;
  visible: boolean;
}
export interface SemanticElement {
  role: string;
  name: string;
  context: string;
  enabled: boolean;
  visible: boolean;
}
export interface Observation {
  id: string;
  version: number;
  strategy: Strategy;
  coordinate?: CoordinateElement[];
  semantic?: SemanticElement[];
  scroll: number;
  selectedTitle: string | null;
  selectedGroup: string | null;
  draft: string;
  dialog: boolean;
  overlay: boolean;
  untrusted: boolean;
}
export interface TargetDescriptor {
  role?: string;
  name: string;
  context?: string;
  point?: { x: number; y: number };
  bounds?: Rect;
}
export interface ActionProposal {
  id: string;
  observationId: string;
  version: number;
  operation: SurfaceElement['operation'] | 'scroll';
  target: TargetDescriptor;
  value?: string;
  requiresApproval: boolean;
  content: string;
}
export interface ActionResult {
  applied: boolean;
  correctTarget: boolean;
  submitted: boolean;
  code: string;
}
export interface VerificationResult {
  passed: boolean;
  source: 'environment-state';
  expected: string;
  actual: string;
  duplicate: boolean;
  code: string;
}
export interface Approval {
  runId: string;
  actionId: string;
  target: string;
  content: string;
  used: boolean;
}
export interface RunEvent {
  seq: number;
  code: string;
  status: Status;
  version: number;
  observationId?: string;
  actionId?: string;
  detail?: string;
  observation?: Observation;
  action?: ActionProposal;
  result?: ActionResult;
  verification?: VerificationResult;
}
export interface Faults {
  enabled: boolean;
  permanentBlock: boolean;
  missingLabel: boolean;
}
export interface ExperimentRun {
  schemaVersion: '1.0';
  id: string;
  scenario: Scenario;
  strategy: Strategy;
  faults: Faults;
  initialState: EnvironmentState;
  environment: EnvironmentState;
  status: Status;
  progress: number;
  steps: number;
  retries: number;
  recoveries: number;
  scoped: boolean;
  injected: boolean;
  observation?: Observation;
  proposal?: ActionProposal;
  approval?: Approval;
  lastResult?: ActionResult;
  verification?: VerificationResult;
  events: RunEvent[];
}
