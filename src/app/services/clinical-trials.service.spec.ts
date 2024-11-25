import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpParams } from '@angular/common/http';
import { ClinicalTrialsService } from './clinical-trials.service';
import { ClinicalTrial } from '../models/clinical-trial.model';
import { of } from 'rxjs';
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
    const favoritesSpy = jasmine.createSpyObj('FavoritesService', ['getFavorites', 'isFavorite'], {
      favorites$: of([])
    });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ClinicalTrialsService,
        { provide: FavoritesService, useValue: favoritesSpy }
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
    it('should fetch trials on initialization', fakeAsync(() => {
      // Set up the mock response
      const params = new HttpParams()
        .set('format', 'json')
        .set('pageSize', '10');

      service.fetchInitialTrials();
      tick();

      const req = httpMock.expectOne(request => 
        request.url === service['apiUrl'] && 
        request.params.toString() === params.toString()
      );
      expect(req.request.method).toBe('GET');
      req.flush({ studies: [mockApiResponse.studies[0]] });

      tick();

      service.getTrials().subscribe(trials => {
        expect(trials.length).toBe(1);
        expect(trials[0].nctId).toBe(mockTrial.nctId);
      });
    }));

    it('should handle error when fetching trials', fakeAsync(() => {
      let loadingState = true;

      // Subscribe to loading state
      service.getLoadingState().subscribe(state => {
        loadingState = state;
      });

      // Make the request
      service.fetchInitialTrials();
      tick();

      // Set up the mock request and error
      const params = new HttpParams()
        .set('format', 'json')
        .set('pageSize', '10');

      const req = httpMock.expectOne(request => 
        request.url === service['apiUrl'] && 
        request.params.toString() === params.toString()
      );
      expect(req.request.method).toBe('GET');
      req.error(new ErrorEvent('API Error'));

      tick();

      // Verify loading state is false after error
      expect(loadingState).toBe(false);

      // Verify trials array is empty
      service.getTrials().subscribe(trials => {
        expect(trials.length).toBe(0);
      });
    }));
  });

  describe('loading state', () => {
    it('should track loading state', fakeAsync(() => {
      let loadingState: boolean | undefined;
      
      service.getLoadingState().subscribe(state => {
        loadingState = state;
      });

      // Initial state should be false
      expect(loadingState).toBeFalse();

      // Trigger a request that will set loading state
      service.fetchInitialTrials();

      // Loading state should be true immediately after request starts
      expect(loadingState).toBeTrue();

      const req = httpMock.expectOne(req => 
        req.url === service['apiUrl'] &&
        req.params.get('format') === 'json' &&
        req.params.get('pageSize') === String(service['maxTrials'])
      );
      req.flush({ studies: [mockApiResponse.studies[0]] });
      tick(); // Let the response processing complete

      // Loading state should be false after request completes
      expect(loadingState).toBeFalse();
    }));
  });

  describe('toggleTimer', () => {
    it('should fetch trial IDs when timer is first enabled', fakeAsync(async () => {
      await service.toggleTimer(true);
      tick();

      const req = httpMock.expectOne(req => 
        req.url === service['apiUrl'] && 
        req.params.get('format') === 'json' &&
        req.params.get('pageSize') === '1000' &&
        req.params.get('fields') === 'NCTId'
      );
      req.flush({ studies: [{ protocolSection: { identificationModule: { nctId: 'NCT123' } } }] });
      tick();

      expect(service['timerSubscription']).toBeDefined();
      httpMock.verify();
    }));

    it('should stop fetching when timer is disabled', fakeAsync(() => {
      // First enable the timer
      service.toggleTimer(true);
      tick();

      const req = httpMock.expectOne(req => req.url === service['apiUrl']);
      req.flush(mockApiResponse);
      tick();

      // Then disable it
      service.toggleTimer(false);
      tick();

      // Verify subscription is cleaned up
      expect(service['timerSubscription']).toBeNull();

      // Verify no more requests are made
      httpMock.verify();
    }));

    it('should handle error when fetching trial IDs', fakeAsync(async () => {
      let error: any;
      try {
        await service.toggleTimer(true);
      } catch (e) {
        error = e;
      }
      tick();

      const req = httpMock.expectOne(request => 
        request.url === service['apiUrl'] && 
        request.params.get('format') === 'json' &&
        request.params.get('pageSize') === '1000' &&
        request.params.get('fields') === 'NCTId'
      );
      req.error(new ErrorEvent('API Error'));
      tick();

      expect(error).toBeTruthy();
      expect(service['timerSubscription']).toBeNull();
      httpMock.verify();
    }));
  });

  describe('getTrialById', () => {
    it('should fetch a single trial by ID', fakeAsync(() => {
      const testId = 'NCT123';
      let result: ClinicalTrial | undefined;
      
      service.getTrialById(testId).subscribe(trial => {
        result = trial;
      });

      const req = httpMock.expectOne(`${service['apiUrl']}/${testId}`);
      expect(req.request.method).toBe('GET');
      req.flush({ studies: [mockApiResponse.studies[0]] });

      tick();

      expect(result).toBeDefined();
      expect(result?.nctId).toBe(testId);
    }));

    it('should handle error when fetching single trial', fakeAsync(() => {
      const testId = 'NCT123';
      let errorResult: any;
      
      service.getTrialById(testId).subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          errorResult = error;
        }
      });

      const req = httpMock.expectOne(`${service['apiUrl']}/${testId}`);
      expect(req.request.method).toBe('GET');
      req.error(new ErrorEvent('API Error'));

      tick();

      expect(errorResult).toBeTruthy();
    }));
  });
});
