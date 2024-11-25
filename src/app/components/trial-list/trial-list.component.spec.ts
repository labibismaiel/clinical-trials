import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { TrialListComponent } from './trial-list.component';
import { ClinicalTrialsService } from '../../services/clinical-trials.service';
import { FavoritesService } from '../../services/favorites.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClinicalTrial } from '../../models/clinical-trial.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';

describe('TrialListComponent', () => {
  let component: TrialListComponent;
  let fixture: ComponentFixture<TrialListComponent>;
  let clinicalTrialsService: jasmine.SpyObj<ClinicalTrialsService>;
  let favoritesService: jasmine.SpyObj<FavoritesService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

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

  const trialsSubject = new BehaviorSubject<ClinicalTrial[]>([mockTrial]);
  const favoritesSubject = new BehaviorSubject<ClinicalTrial[]>([]);
  const loadingSubject = new BehaviorSubject<boolean>(false);

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('ClinicalTrialsService', [
      'getTrials',
      'getFavorites',
      'toggleTimer',
      'toggleFavorite',
      'fetchInitialTrials',
      'getLoadingState'
    ], {
      trials$: trialsSubject.asObservable(),
      loading$: loadingSubject.asObservable()
    });

    serviceSpy.getTrials.and.returnValue(trialsSubject.asObservable());
    serviceSpy.getLoadingState.and.returnValue(loadingSubject.asObservable());
    serviceSpy.toggleTimer.and.returnValue(Promise.resolve());
    serviceSpy.toggleFavorite.and.returnValue(of({ ...mockTrial, isFavorite: true }));

    const favoritesSpy = jasmine.createSpyObj('FavoritesService', ['getFavorites'], {
      favorites$: favoritesSubject.asObservable()
    });

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        RouterTestingModule,
        MatSlideToggleModule,
        MatButtonToggleModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        MatCardModule,
        MatSnackBarModule,
        FormsModule
      ],
      providers: [
        { provide: ClinicalTrialsService, useValue: serviceSpy },
        { provide: FavoritesService, useValue: favoritesSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    clinicalTrialsService = TestBed.inject(ClinicalTrialsService) as jasmine.SpyObj<ClinicalTrialsService>;
    favoritesService = TestBed.inject(FavoritesService) as jasmine.SpyObj<FavoritesService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    fixture = TestBed.createComponent(TrialListComponent);
    component = fixture.componentInstance;

    // Initialize component subscriptions
    component.ngOnInit();
    fixture.detectChanges();
  });

  afterEach(async () => {
    await component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should fetch initial trials', () => {
      expect(clinicalTrialsService.fetchInitialTrials).toHaveBeenCalled();
    });

    it('should subscribe to trials', () => {
      const newTrials = [mockTrial, { ...mockTrial, nctId: 'NCT456' }];
      trialsSubject.next(newTrials);
      expect(component.trials).toEqual(newTrials);
    });

    it('should subscribe to loading state', () => {
      loadingSubject.next(true);
      expect(component.loading).toBeTrue();
    });
  });

  describe('auto-fetch functionality', () => {
    it('should start auto-fetch when enabled', fakeAsync(async () => {
      component.autoFetch = true;
      component.toggleAutoFetch({ checked: true });
      tick();
      expect(clinicalTrialsService.toggleTimer).toHaveBeenCalledWith(true);
    }));

    it('should stop auto-fetch when disabled', fakeAsync(async () => {
      component.autoFetch = false;
      component.toggleAutoFetch({ checked: false });
      tick();
      expect(clinicalTrialsService.toggleTimer).toHaveBeenCalledWith(false);
    }));

    it('should handle error when toggling auto-fetch', fakeAsync(async () => {
      clinicalTrialsService.toggleTimer.and.returnValue(Promise.reject('Test error'));
      spyOn(console, 'error');
      spyOn(component['snackBar'], 'open');

      component.autoFetch = true;
      component.toggleAutoFetch({ checked: true });
      tick();

      expect(component.autoFetch).toBeFalse();
      expect(console.error).toHaveBeenCalledWith('Error toggling auto-fetch:', 'Test error');
      expect(component['snackBar'].open).toHaveBeenCalledWith(
        'Error toggling auto-fetch. Please try again.',
        'Close',
        { duration: 3000 }
      );
    }));
  });

  describe('favorite functionality', () => {
    beforeEach(() => {
      // Reset the spy's behavior for each test
      clinicalTrialsService.toggleFavorite.calls.reset();
    });

    it('should prevent adding favorites when limit reached', () => {
      favoritesSubject.next(Array(10).fill(mockTrial));
      component.maxFavoritesReached = true;
      fixture.detectChanges();

      component.toggleFavorite({ ...mockTrial, isFavorite: false });
      expect(clinicalTrialsService.toggleFavorite).not.toHaveBeenCalled();
    });

    it('should toggle favorite status', fakeAsync(() => {
      // Set up initial state with trial data
      trialsSubject.next([mockTrial]);
      fixture.detectChanges();

      // Set up the toggle favorite response
      const updatedTrial = { ...mockTrial, isFavorite: true };
      clinicalTrialsService.toggleFavorite.and.returnValue(of(updatedTrial));
      
      // Trigger favorite toggle
      component.toggleFavorite(mockTrial);
      tick();

      // Verify the service was called with the correct trial
      expect(clinicalTrialsService.toggleFavorite).toHaveBeenCalledWith(mockTrial);

      // Verify the trial list was updated
      expect(component.trials.find(t => t.nctId === mockTrial.nctId)?.isFavorite).toBeTrue();
    }));

    it('should handle error when toggling favorite', fakeAsync(() => {
      spyOn(console, 'error');

      // Set up initial state with trial data
      trialsSubject.next([mockTrial]);
      fixture.detectChanges();

      // Set up the error response
      clinicalTrialsService.toggleFavorite.and.returnValue(throwError(() => new Error('Test error')));
      
      // Trigger favorite toggle
      component.toggleFavorite(mockTrial);
      tick();

      expect(clinicalTrialsService.toggleFavorite).toHaveBeenCalledWith(mockTrial);
      expect(console.error).toHaveBeenCalledWith('Error toggling favorite:', jasmine.any(Error));
      expect(snackBar.open).toHaveBeenCalledWith('Error updating favorite status', 'Close', { duration: 3000 });
    }));

    it('should not navigate when clicking favorite button', fakeAsync(() => {
      // Set up initial state with trial data
      trialsSubject.next([mockTrial]);
      fixture.detectChanges();
      
      // Set up the toggle favorite response
      clinicalTrialsService.toggleFavorite.and.returnValue(of({ ...mockTrial, isFavorite: true }));
      
      // Trigger favorite toggle
      component.toggleFavorite(mockTrial);
      tick(); // Wait for any async operations
      
      expect(router.navigate).not.toHaveBeenCalled();
      expect(clinicalTrialsService.toggleFavorite).toHaveBeenCalledWith(mockTrial);
    }));
  });

  describe('view mode', () => {
    it('should initialize with card view', () => {
      expect(component.viewMode).toBe('card');
    });

    it('should allow switching between card and list view', () => {
      component.viewMode = 'list';
      expect(component.viewMode).toBe('list');

      component.viewMode = 'card';
      expect(component.viewMode).toBe('card');
    });

    it('should update view mode through button toggle', () => {
      // Set up initial state
      trialsSubject.next([mockTrial]);
      fixture.detectChanges();
      
      // Verify initial state
      expect(component.viewMode).toBe('card');
      expect(fixture.debugElement.query(By.css('.trials-grid'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('.trials-list'))).toBeFalsy();
      
      // Update the model value
      component.viewMode = 'list';
      fixture.detectChanges();
      
      // Verify the view has changed
      expect(component.viewMode).toBe('list');
      expect(fixture.debugElement.query(By.css('.trials-list'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('.trials-grid'))).toBeFalsy();
    });
  });

  describe('navigation', () => {
    it('should navigate to trial details when clicking on trial card content', () => {
      // Set up initial state with trial data
      trialsSubject.next([mockTrial]);
      fixture.detectChanges();

      // Trigger click on the trial card
      component.viewTrialDetails(mockTrial);
      
      expect(router.navigate).toHaveBeenCalledWith(['/trial', mockTrial.nctId]);
    });

    it('should navigate to trial details when clicking on trial list content', () => {
      // Set up initial state with trial data
      trialsSubject.next([mockTrial]);
      component.viewMode = 'list';
      fixture.detectChanges();

      // Trigger click on the trial card in list view
      component.viewTrialDetails(mockTrial);
      
      expect(router.navigate).toHaveBeenCalledWith(['/trial', mockTrial.nctId]);
    });

    it('should not navigate when clicking favorite button', fakeAsync(() => {
      // Set up initial state with trial data
      trialsSubject.next([mockTrial]);
      fixture.detectChanges();
      
      // Set up the toggle favorite response
      clinicalTrialsService.toggleFavorite.and.returnValue(of({ ...mockTrial, isFavorite: true }));
      
      // Trigger favorite toggle
      component.toggleFavorite(mockTrial);
      tick(); // Wait for any async operations
      
      expect(router.navigate).not.toHaveBeenCalled();
      expect(clinicalTrialsService.toggleFavorite).toHaveBeenCalledWith(mockTrial);
    }));
  });

  describe('cleanup', () => {
    it('should stop timer and unsubscribe on destroy', fakeAsync(async () => {
      component.autoFetch = true;
      const subscriptionSpy = spyOn(component['subscriptions'][0], 'unsubscribe');
      
      await component.ngOnDestroy();
      tick();

      expect(clinicalTrialsService.toggleTimer).toHaveBeenCalledWith(false);
      expect(subscriptionSpy).toHaveBeenCalled();
    }));

    it('should handle error when stopping timer on destroy', fakeAsync(async () => {
      // Set up autoFetch to true so timer stop is attempted
      component.autoFetch = true;
      clinicalTrialsService.toggleTimer.and.returnValue(Promise.reject(new Error('Test error')));
      spyOn(console, 'error');
      
      try {
        await component.ngOnDestroy();
        tick();
        
        expect(console.error).toHaveBeenCalledWith('Error stopping timer:', jasmine.any(Error));
      } catch (error) {
        // Error is expected to be caught in ngOnDestroy
        expect(console.error).toHaveBeenCalledWith('Error stopping timer:', jasmine.any(Error));
      }
    }));
  });
});
