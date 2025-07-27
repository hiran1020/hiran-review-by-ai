
export interface FeedbackItem {
  line: number | string;
  issue: string;
  recommendation: string;
  problemCode?: string;
  codeExample?: string;
}

export interface ReviewResult {
  overallSummary: string;
  bugs: FeedbackItem[];
  security: FeedbackItem[];
  performance: FeedbackItem[];
  improvementsAndBestPractices: FeedbackItem[];
  clarityAndStyle: FeedbackItem[];
  documentation: FeedbackItem[];
  architecture: FeedbackItem[];
  codeSmells: FeedbackItem[];
  fullRefactoredCode: string;
}