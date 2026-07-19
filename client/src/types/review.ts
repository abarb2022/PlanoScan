export interface Violation {
  severity: "HIGH" | "MEDIUM" | "LOW";
  shelf: number;
  section: string;
  expected: string;
  found: string;
  issue: string;
}

export interface SubScores {
  brandAccuracy: number;
  quantityAccuracy: number;
  positionAccuracy: number;
  stockFullness: number;
}

export interface ScoreDetail {
  subScores: SubScores;
  violations: Violation[];
  confidence: number;
  notes: string | null;
}

export interface FlaggedSubmission {
  submissionId: string;
  repName: string;
  repEmail: string;
  storeName: string;
  storeAddress: string | null;
  assignmentDate: string;
  submittedAt: string;
  photoUrl: string;
  planogramName: string | null;
  overallScore: number;
  scoreDetail: ScoreDetail;
}

export interface ReviewRequest {
  action: "ACKNOWLEDGE" | "DISPUTE";
  correctedScore?: number;
  notes?: string;
}
