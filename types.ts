
export enum GradeLevel {
  LOWER = '小学低年级 (1-2年级)',
  MIDDLE = '小学中年级 (3-4年级)',
  UPPER = '小学高年级 (5-6年级)',
}

export enum SubjectType {
  SCIENCE = '理科 (数学/科学/信息)',
  ARTS = '文科 (语文/英语/社科)',
}

export interface VisualNode {
  id: string;
  label: string;
  group?: number; // 1: Concept, 2: Sub-concept, 3: Detail
}

export interface VisualLink {
  source: string;
  target: string;
  label?: string;
}

export interface VisualData {
  nodes: VisualNode[];
  links: VisualLink[];
  type: 'flowchart' | 'mindmap' | 'process';
}

// --- New Simulation Types ---
export interface SimElement {
  id: string;
  type: 'circle' | 'rect' | 'line' | 'path' | 'text';
  label?: string;
  color: string;
  // Normalized coordinates (0-100)
  x?: number; y?: number;
  x2?: number; y2?: number;
  width?: number; height?: number;
  r?: number;
  d?: string; // SVG Path string
}

export interface SimAnimation {
  targetId: string; // Element to animate
  action: 'moveAlongPath' | 'moveTo';
  pathId?: string; // ID of the path element to follow
  toX?: number; toY?: number;
  duration: number; // seconds
  delay?: number;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'; // Physics-based easing
}

export interface SimulationData {
  title: string;
  description?: string;
  elements: SimElement[];
  animations: SimAnimation[];
}
// ----------------------------

export interface ScaffoldingStep {
  stepNumber: number;
  phaseName: string; // e.g., "Activation", "Exploration"
  cognitiveGoal: string; // Cognitive objective based on Vygotsky
  teacherScript: string; // The exact question/dialogue to use
  studentExpectedResponse: string; // What we expect kids to say
  scenario?: string; // For Arts: A descriptive scene/context
  visualData: VisualData; // Structure (MindMap/Flowchart)
}

export interface LessonPlan {
  topic: string;
  grade: string;
  subject: string;
  summary: string;
  steps: ScaffoldingStep[];
  simulationData?: SimulationData; // For Science: Global concept simulation
}

export interface SearchParams {
  grade: GradeLevel;
  subject: SubjectType;
  concept: string;
}
