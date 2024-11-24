export interface ClinicalTrialsApiResponse {
  studies: Array<{
    protocolSection: {
      identificationModule: {
        nctId: string;
        briefTitle: string;
        officialTitle?: string;
      };
      statusModule: {
        overallStatus: string;
        lastUpdatePostDate?: string;
      };
      designModule?: {
        phases?: string[];
        studyType?: string;
      };
      conditionsModule?: {
        conditions?: string[];
      };
      descriptionModule?: {
        briefSummary?: string;
      };
      sponsorCollaboratorsModule?: {
        leadSponsor?: {
          name?: string;
        };
      };
      armsInterventionsModule?: {
        interventions?: Array<{
          interventionType?: string;
          interventionName?: string;
        }>;
      };
      contactsLocationsModule?: {
        locations?: Array<{
          facility?: string;
          city?: string;
          country?: string;
        }>;
      };
    };
  }>;
}
