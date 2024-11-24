import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ClinicalTrialsService } from './clinical-trials.service';
import { ClinicalTrial } from '../models/clinical-trial.model';
import { of, throwError } from 'rxjs';
import { FavoritesService } from './favorites.service';

describe('ClinicalTrialsService', () => {
  let service: ClinicalTrialsService;
  let httpMock: HttpTestingController;
  let favoritesService: jasmine.SpyObj<FavoritesService>;

  const mockTrial: ClinicalTrial = {
    nctId: 'NCT123',
    briefTitle: 'Test Trial',
    officialTitle: 'Official Test Trial',
    overallStatus: 'Recruiting',
    phase: 'Phase 1',
    studyType: 'Interventional',
    condition: 'Test Condition',
    lastUpdatePosted: '2023-01-01',
    isFavorite: false,
    description: 'Test description',
    interventions: ['Test intervention'],
    locations: ['Test location']
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
        },
        descriptionModule: {
          briefSummary: mockTrial.description
        },
        armsInterventionsModule: {
          interventions: [{
            interventionType: 'Type',
            interventionName: 'Test intervention'
          }]
        },
        contactsLocationsModule: {
          locations: [{
            facility: 'Test',
            city: 'Test City',
            country: 'Test Country'
          }]
        }
      }
    }]
  };

  beforeEach(() => {
    const favoritesServiceSpy = jasmine.createSpyObj('FavoritesService', 
      ['addToFavorites', 'removeFromFavorites', 'isFavorite', 'getFavoritesCount']
    );
    favoritesServiceSpy.isFavorite.and.returnValue(false);
    favoritesServiceSpy.getFavoritesCount.and.returnValue(0);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ClinicalTrialsService,
        { provide: FavoritesService, useValue: favoritesServiceSpy }
      ]
    });
    service = TestBed.inject(ClinicalTrialsService);
    httpMock = TestBed.inject(HttpTestingController);
    favoritesService = TestBed.inject(FavoritesService) as jasmine.SpyObj<FavoritesService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('fetchInitialTrials', () => {
    it('should fetch trials on initialization', () => {
      const req = httpMock.expectOne(req => 
        req.url === 'https://clinicaltrials.gov/api/v2/studies' &&
        req.params.get('format') === 'json' &&
        req.params.get('pageSize') === String(service['maxTrials'])
      );
      expect(req.request.method).toBe('GET');
      
      req.flush(mockApiResponse);

      service.getTrials().subscribe(trials => {
        expect(trials.length).toBe(1);
        expect(trials[0]).toEqual(jasmine.objectContaining({
          nctId: mockTrial.nctId,
          briefTitle: mockTrial.briefTitle
        }));
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

    it('should handle error response', () => {
      const req = httpMock.expectOne(req => 
        req.url === 'https://clinicaltrials.gov/api/v2/studies'
      );
      req.error(new ErrorEvent('API Error'));

      service.getTrials().subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
        }
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
        req.url === 'https://clinicaltrials.gov/api/v2/studies'
      );
      trialReq.flush(mockApiResponse);

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
      const trialReq = httpMock.expectOne(req => 
        req.url === 'https://clinicaltrials.gov/api/v2/studies'
      );
      trialReq.flush(mockApiResponse);

      service.toggleTimer(false);
      tick(5000); // No more requests should be made

      httpMock.verify(); // This will fail if any unexpected requests were made
    }));

    it('should handle error when fetching trial IDs', fakeAsync(() => {
      service.toggleTimer(true);

      const req = httpMock.expectOne(req => 
        req.params.get('fields') === 'NCTId'
      );
      req.error(new ErrorEvent('API Error'));

      tick(5000);

      expect(service['trialIds'].length).toBe(0);
      service.toggleTimer(false); // Cleanup
    }));
  });

  describe('toggleFavorite', () => {
    it('should add trial to favorites', () => {
      const trial = { ...mockTrial, isFavorite: false };
      service.toggleFavorite(trial);

      expect(favoritesService.addToFavorites).toHaveBeenCalledWith(trial);
    });

    it('should remove trial from favorites', () => {
      const trial = { ...mockTrial, isFavorite: true };
      service.toggleFavorite(trial);

      expect(favoritesService.removeFromFavorites).toHaveBeenCalledWith(trial.nctId);
    });

    it('should update trial favorite status in trials list', () => {
      const trial = { ...mockTrial, isFavorite: false };
      service.toggleFavorite(trial);

      service.getTrials().subscribe(trials => {
        const updatedTrial = trials.find(t => t.nctId === trial.nctId);
        expect(updatedTrial?.isFavorite).toBe(true);
      });
    });

    it('should handle error when toggling favorite', () => {
      const trial = { ...mockTrial };
      favoritesService.addToFavorites.and.throwError('Test error');

      expect(() => service.toggleFavorite(trial))
        .toThrow();
    });
  });

  describe('getTrialById', () => {
    it('should fetch trial by ID', () => {
      const testId = 'NCT123';
      
      service.getTrialById(testId).subscribe(trial => {
        expect(trial).toBeTruthy();
        expect(trial.nctId).toBe(testId);
        expect(trial.briefTitle).toBeDefined();
      });

      const req = httpMock.expectOne(`${service['apiUrl']}/${testId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockApiResponse.studies[0]);
    });

    it('should handle error when fetching trial by ID', () => {
      const testId = 'NCT123';
      
      service.getTrialById(testId).subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(`${service['apiUrl']}/${testId}`);
      req.error(new ErrorEvent('API Error'));
    });

    it('should handle missing optional fields in API response', () => {
      const testId = 'NCT123';
      const incompleteResponse = {
        protocolSection: {
          identificationModule: {
            nctId: testId,
            briefTitle: 'Test Trial'
          },
          statusModule: {
            overallStatus: 'Recruiting'
          }
        }
      };

      service.getTrialById(testId).subscribe(trial => {
        expect(trial.nctId).toBe(testId);
        expect(trial.briefTitle).toBe('Test Trial');
        expect(trial.phase).toBeUndefined();
        expect(trial.condition).toBeUndefined();
        expect(trial.interventions).toEqual([]);
        expect(trial.locations).toEqual([]);
      });

      const req = httpMock.expectOne(`${service['apiUrl']}/${testId}`);
      req.flush(incompleteResponse);
    });
  });

  describe('loading state', () => {
    it('should track loading state', () => {
      let loadingStates: boolean[] = [];
      service.getLoadingState().subscribe(state => {
        loadingStates.push(state);
      });

      const req = httpMock.expectOne(req => 
        req.url === 'https://clinicaltrials.gov/api/v2/studies'
      );

      expect(loadingStates).toContain(true); // Loading started
      req.flush(mockApiResponse);
      expect(loadingStates).toContain(false); // Loading finished
    });
  });
});
