import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ClinicalTrialsService } from './clinical-trials.service';
import { ClinicalTrial } from '../models/clinical-trial.model';
import { of, throwError } from 'rxjs';

describe('ClinicalTrialsService', () => {
  let service: ClinicalTrialsService;
  let httpMock: HttpTestingController;

  const mockTrial: ClinicalTrial = {
    nctId: 'NCT123',
    briefTitle: 'Test Trial',
    officialTitle: 'Official Test Trial',
    overallStatus: 'Recruiting',
    phase: 'Phase 1',
    studyType: 'Interventional',
    condition: 'Test Condition',
    lastUpdatePosted: '2023-01-01',
    isFavorite: false
  };

  const mockApiResponse = {
    studies: [{
      protocolSection: {
        identificationModule: {
          nctId: mockTrial.nctId,
          briefTitle: mockTrial.briefTitle,
          officialTitle: mockTrial.officialTitle
        },
        statusModule: {
          overallStatus: mockTrial.overallStatus,
          lastUpdatePostDate: mockTrial.lastUpdatePosted
        },
        designModule: {
          phases: [mockTrial.phase],
          studyType: mockTrial.studyType
        },
        conditionsModule: {
          conditions: [mockTrial.condition]
        }
      }
    }]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ClinicalTrialsService]
    });
    service = TestBed.inject(ClinicalTrialsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('fetchInitialTrials', () => {
    it('should fetch 10 trials on initialization', () => {
      // Service constructor calls fetchInitialTrials
      const req = httpMock.expectOne(req => 
        req.url === 'https://clinicaltrials.gov/api/v2/studies' &&
        req.params.get('format') === 'json' &&
        req.params.get('pageSize') === '10'
      );
      expect(req.request.method).toBe('GET');
      
      const multipleTrials = {
        studies: Array(10).fill(mockApiResponse.studies[0])
      };
      req.flush(multipleTrials);

      service.getTrials().subscribe(trials => {
        expect(trials.length).toBe(10);
        expect(trials[0]).toEqual(mockTrial);
      });
    });

    it('should handle empty response', () => {
      const req = httpMock.expectOne(req => 
        req.url === 'https://clinicaltrials.gov/api/v2/studies'
      );
      req.flush({ studies: [] });

      service.getTrials().subscribe(trials => {
        expect(trials.length).toBe(0);
      });
    });
  });

  describe('toggleTimer', () => {
    it('should fetch trial IDs when timer is first enabled', fakeAsync(() => {
      service.toggleTimer(true);

      const req = httpMock.expectOne(req => 
        req.url === 'https://clinicaltrials.gov/api/v2/studies' &&
        req.params.get('fields') === 'NCTId'
      );
      expect(req.request.method).toBe('GET');

      const mockIds = {
        studies: Array(1000).fill({
          protocolSection: {
            identificationModule: {
              nctId: 'NCT' + Math.random()
            }
          }
        })
      };
      req.flush(mockIds);

      tick(5000); // Wait for first timer tick

      const trialReq = httpMock.expectOne(req => 
        req.url.startsWith('https://clinicaltrials.gov/api/v2/studies/NCT')
      );
      trialReq.flush(mockApiResponse.studies[0]);

      service.getTrials().subscribe(trials => {
        expect(trials.length).toBeGreaterThan(0);
      });

      service.toggleTimer(false); // Cleanup
    }));

    it('should stop fetching when timer is disabled', fakeAsync(() => {
      service.toggleTimer(true);

      // Handle initial IDs fetch
      const idsReq = httpMock.expectOne(req => 
        req.params.get('fields') === 'NCTId'
      );
      idsReq.flush({
        studies: Array(10).fill({
          protocolSection: {
            identificationModule: {
              nctId: 'NCT123'
            }
          }
        })
      });

      tick(5000); // First interval
      httpMock.expectOne(req => 
        req.url.startsWith('https://clinicaltrials.gov/api/v2/studies/NCT')
      ).flush(mockApiResponse.studies[0]);

      service.toggleTimer(false);
      tick(5000); // No more requests should be made

      httpMock.verify(); // This will fail if any unexpected requests were made
    }));
  });

  describe('toggleFavorite', () => {
    it('should add trial to favorites if not already favorite', () => {
      service.toggleFavorite(mockTrial);
      
      service.getFavorites().subscribe(favorites => {
        expect(favorites.length).toBe(1);
        expect(favorites[0]).toEqual({ ...mockTrial, isFavorite: true });
      });
    });

    it('should remove trial from favorites if already favorite', () => {
      // First add
      service.toggleFavorite(mockTrial);
      // Then remove
      service.toggleFavorite({ ...mockTrial, isFavorite: true });
      
      service.getFavorites().subscribe(favorites => {
        expect(favorites.length).toBe(0);
      });
    });

    it('should not add more than 10 favorites', () => {
      // Add 10 different trials
      for (let i = 0; i < 11; i++) {
        service.toggleFavorite({
          ...mockTrial,
          nctId: `NCT${i}`,
          isFavorite: false
        });
      }

      service.getFavorites().subscribe(favorites => {
        expect(favorites.length).toBe(10);
      });
    });

    it('should update trial favorite status in trials list', () => {
      // First add trial to trials list
      const req = httpMock.expectOne(req => 
        req.url === 'https://clinicaltrials.gov/api/v2/studies'
      );
      req.flush(mockApiResponse);

      // Toggle favorite
      service.toggleFavorite(mockTrial);

      service.getTrials().subscribe(trials => {
        const trial = trials.find(t => t.nctId === mockTrial.nctId);
        expect(trial?.isFavorite).toBe(true);
      });
    });
  });

  describe('getTrialById', () => {
    const mockApiResponse = {
      studies: [{
        protocolSection: {
          identificationModule: {
            nctId: 'NCT123',
            briefTitle: 'Test Trial',
            officialTitle: 'Official Test Trial'
          },
          statusModule: {
            overallStatus: 'Recruiting',
            phase: 'Phase 1'
          },
          conditionsModule: {
            conditions: ['Test Condition']
          },
          descriptionModule: {
            briefSummary: 'Test description'
          },
          designModule: {
            studyType: 'Interventional',
            enrollmentInfo: {
              count: 100
            }
          },
          armsInterventionsModule: {
            interventions: [{
              name: 'Test intervention'
            }]
          },
          contactsLocationsModule: {
            locations: [{
              facility: 'Test location'
            }]
          }
        }
      }]
    };

    it('should fetch trial by ID', (done) => {
      const testId = 'NCT123';
      httpMock.get.and.returnValue(of(mockApiResponse));

      service.getTrialById(testId).subscribe(trial => {
        expect(trial.nctId).toBe(testId);
        expect(trial.briefTitle).toBe('Test Trial');
        expect(trial.overallStatus).toBe('Recruiting');
        expect(trial.phase).toBe('Phase 1');
        expect(trial.condition).toBe('Test Condition');
        expect(trial.description).toBe('Test description');
        expect(trial.studyType).toBe('Interventional');
        expect(trial.enrollment).toBe(100);
        expect(trial.interventions).toEqual(['Test intervention']);
        expect(trial.locations).toEqual(['Test location']);
        done();
      });

      expect(httpMock.get).toHaveBeenCalledWith(
        `https://clinicaltrials.gov/api/v2/studies/${testId}`
      );
    });

    it('should handle error when fetching trial by ID', (done) => {
      const testId = 'NCT123';
      const errorResponse = new Error('API Error');
      httpMock.get.and.returnValue(throwError(() => errorResponse));

      service.getTrialById(testId).subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });
    });

    it('should convert API response to ClinicalTrial model', (done) => {
      const testId = 'NCT123';
      httpMock.get.and.returnValue(of(mockApiResponse));

      service.getTrialById(testId).subscribe(trial => {
        expect(trial instanceof ClinicalTrial).toBeTrue();
        done();
      });
    });

    it('should handle missing optional fields in API response', (done) => {
      const testId = 'NCT123';
      const incompleteResponse = {
        studies: [{
          protocolSection: {
            identificationModule: {
              nctId: testId,
              briefTitle: 'Test Trial'
            },
            statusModule: {
              overallStatus: 'Recruiting'
            }
          }
        }]
      };

      httpMock.get.and.returnValue(of(incompleteResponse));

      service.getTrialById(testId).subscribe(trial => {
        expect(trial.nctId).toBe(testId);
        expect(trial.briefTitle).toBe('Test Trial');
        expect(trial.phase).toBeUndefined();
        expect(trial.condition).toBeUndefined();
        expect(trial.interventions).toEqual([]);
        expect(trial.locations).toEqual([]);
        done();
      });
    });
  });
});
