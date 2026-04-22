export interface PaperAuthor {
  name: string;
  affiliations: string[];
  orcid: string;
}

export interface Paper {
  pmid: string;
  title: string;
  authors: Array<string | PaperAuthor>;
  journal: string;
  pubDate: string;
  abstract: string;
  meshTerms: string[];
  doi: string;
  pubmedUrl: string;
}

export interface AuthorTopic {
  name: string;
  count: number;
  id: string;
}

export interface ResearchAuthor {
  id: string;
  name: string;
  normalizedName: string;
  variants: string[];
  orcid: string;
  worksCount: number;
  citedByCount: number;
  hIndex: number;
  i10Index: number;
  conditionPapers: string[];
  conditionPapersCount: number;
  currentAffiliation: string;
  currentInstitutionId: string;
  affiliationHistory: string[];
  topics: AuthorTopic[];
  openAlexUrl: string;
  orcidUrl: string;
  updatedDate: string;
}

export interface AssociatedInstitution {
  id: string;
  name: string;
  relationship: string;
}

export interface ResearchInstitution {
  id: string;
  name: string;
  worksCount: number;
  citedByCount: number;
  conditionPapers: string[];
  conditionPapersCount: number;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  type: string;
  homepage: string;
  imageUrl: string;
  associatedInstitutions: AssociatedInstitution[];
  openAlexUrl: string;
  wikipediaUrl: string;
  updatedDate: string;
}

export interface TrialLocation {
  facility?: string;
  city?: string;
  state?: string;
  country?: string;
  geoPoint?: {
    lat?: number;
    lon?: number;
  };
}

export interface TrialIntervention {
  type?: string;
  name: string;
  description?: string;
}

export interface ClinicalTrial {
  nctId: string;
  briefTitle: string;
  officialTitle?: string;
  status: string;
  statusVerifiedDate?: string;
  studyType?: string;
  phases: string[];
  briefSummary?: string;
  detailedDescription?: string;
  conditions: string[];
  startDate?: string;
  completionDate?: string;
  primaryCompletionDate?: string;
  enrollment?: number;
  enrollmentType?: string;
  sponsor?: string;
  sponsorClass?: string;
  locations: TrialLocation[];
  interventions: TrialIntervention[];
  hasResults: boolean;
  url: string;
}

export interface ClinicalTrialsData {
  lastUpdated: string;
  totalTrials: number;
  trials: ClinicalTrial[];
}

export const emptyClinicalTrialsData: ClinicalTrialsData = {
  lastUpdated: '',
  totalTrials: 0,
  trials: [],
};
