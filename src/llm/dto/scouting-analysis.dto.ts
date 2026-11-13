export interface ScoutingAnalysis {
  summary: string;
  recommendation: 'promote' | 'retain' | 'release';
  reasons: string[];
}