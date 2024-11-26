import { TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpParams } from '@angular/common/http';
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
      // Setup
      service.fetchInitialTrials();

      // Service will retry 3 times
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${service['apiUrl']}?format=json&pageSize=10`);
        expect(req.request.method).toBe('GET');
        req.error(new ErrorEvent('API Error'));
        tick(); // Let the retry logic process
      }

      // Final request that will fail
      const req = httpMock.expectOne(`${service['apiUrl']}?format=json&pageSize=10`);
      expect(req.request.method).toBe('GET');
      req.error(new ErrorEvent('API Error'));

      tick(); // Let error handlers run

      // Check loading state
      let loadingState = true;
      service.getLoadingState().subscribe(state => {
        loadingState = state;
      });
      expect(loadingState).toBe(false); // Loading should be false after error

      // Get current trials value
      let currentTrials: ClinicalTrial[] = [];
      service.getTrials().subscribe(trials => {
        currentTrials = trials;
      });
      expect(currentTrials).toEqual([]); // Trials should be empty on error
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
    it('should fetch trial IDs when timer is first enabled', fakeAsync(() => {
      // Call toggleTimer
      service.toggleTimer(true);
      tick();

      // Verify and handle the HTTP request for trial IDs
      const req = httpMock.expectOne(req =>
        req.url === service['apiUrl'] &&
        req.params.get('format') === 'json' &&
        req.params.get('pageSize') === '1000' &&
        req.params.get('fields') === 'NCTId'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ studies: [{ protocolSection: { identificationModule: { nctId: 'NCT123' } } }] });

      tick(); // Let the timer start

      // Cleanup before any interval triggers
      service.toggleTimer(false);
      tick();

      // Verify no pending requests
      httpMock.verify();
    }));

    it('should stop fetching when timer is disabled', fakeAsync(() => {
      // Start the timer first
      service.toggleTimer(true);
      tick();

      // Get and handle the initial request for trial IDs
      const idReq = httpMock.expectOne(request =>
        request.url === service['apiUrl'] &&
        request.params.get('format') === 'json' &&
        request.params.get('pageSize') === '1000' &&
        request.params.get('fields') === 'NCTId'
      );
      expect(idReq.request.method).toBe('GET');

      // Respond with some trial IDs
      idReq.flush({
        studies: [
          { protocolSection: { identificationModule: { nctId: 'NCT001' } } }
        ]
      });

      // Let the initial fetch happen
      tick();

      // Handle the initial random trial request
      const initialTrialReq = httpMock.expectOne(request => 
        request.url === `${service['apiUrl']}/NCT001`
      );
      initialTrialReq.flush(mockApiResponse.studies[0]);

      // Now disable the timer
      service.toggleTimer(false);
      tick();

      // Verify no more requests are pending
      httpMock.verify();

      // Advance time to ensure no more requests are made
      tick(service['fetchInterval'] * 2);
      
      // Should not have any pending requests
      httpMock.verify();
    }));

    it('should fetch trial IDs and start timer when enabled', fakeAsync(async () => {
      const mockStudies = [
        { protocolSection: { identificationModule: { nctId: 'NCT001' } } },
        { protocolSection: { identificationModule: { nctId: 'NCT002' } } }
      ];

      // Start the timer
      service.toggleTimer(true);
      tick();

      // Get the pending request
      const req = httpMock.expectOne(request =>
        request.url === service['apiUrl'] &&
        request.params.get('format') === 'json' &&
        request.params.get('pageSize') === '1000' &&
        request.params.get('fields') === 'NCTId'
      );
      expect(req.request.method).toBe('GET');

      // Simulate successful response
      req.flush({ studies: mockStudies });
      tick();

      // Clean up any remaining async tasks
      discardPeriodicTasks();

      // Clean up
      await service.toggleTimer(false);
      tick();

      // Verify no pending requests
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
