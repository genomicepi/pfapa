export type { PaperAuthor as Author, Paper } from './data-types';

export interface Summary {
  pmid: string;
  plainSummary?: string;
  clinicalSummary?: string;
  evidenceGrade?: string;
  treatmentRelevant?: boolean;
  generatedDate?: string;
}

export interface Treatment {
  id: string;
  name: string;
  category: string;
  description: string;
  mechanism?: string;
  evidenceGrade: string;
  studyCount?: number;
  references?: string[];
  sideEffects?: string[];
}

export interface Digest {
  id: string;
  title: string;
  date: string;
  content: string;
  paperCount: number;
  pmids: string[];
}
