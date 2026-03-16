
export type EventType = 'interview' | 'pitch' | 'talk' | 'presentation' | 'other';

export type Project = {
  id: string;
  title: string;
  event_type: EventType;
  event_date: string | null;  // ISO date
  notes: string | null;
  created_at: string;
  document_count: number;
  simulation_count: number;
  readiness_score: number | null;  // 0.0–1.0, avg of linked simulation avg_scores
};

export type LinkedDocument = {
  id: string;
  name: string;
  file_type: string;
  created_at: string;
};

export type LinkedSimulation = {
  id: string;
  persona_config: { role: string; industry: string; difficulty: number };
  status: 'active' | 'completed';
  created_at: string;
  avg_score: number | null;  // 0.0–1.0
};

export type ProjectDetail = Project & {
  documents: LinkedDocument[];
  simulations: LinkedSimulation[];
};
