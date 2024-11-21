export interface ClinicalTrial {
  nctId: string;
  briefTitle: string;
  officialTitle?: string;
  overallStatus: string;
  phase?: string;
  studyType?: string;
  condition?: string;
  lastUpdatePosted?: string;
  isFavorite?: boolean;
}