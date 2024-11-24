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
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let router: jasmine.SpyObj<Router>;

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
    ]);
    const favoritesSpy = jasmine.createSpyObj('FavoritesService', ['getFavorites'], {
      favorites$: favoritesSubject.asObservable()
    });
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    serviceSpy.getTrials.and.returnValue(trialsSubject.asObservable());
    serviceSpy.getFavorites.and.returnValue(favoritesSubject.asObservable());
    serviceSpy.getLoadingState.and.returnValue(loadingSubject.asObservable());
    serviceSpy.toggleTimer.and.returnValue(Promise.resolve());
    serviceSpy.toggleFavorite.and.returnValue(of({ ...mockTrial, isFavorite: true }));
    favoritesSpy.getFavorites.and.returnValue(favoritesSubject.asObservable());

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        RouterTestingModule,
        FormsModule,
        MatSlideToggleModule,
        MatButtonToggleModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        MatCardModule,
        MatSnackBarModule,
        TrialListComponent
      ],
      providers: [
        { provide: ClinicalTrialsService, useValue: serviceSpy },
        { provide: FavoritesService, useValue: favoritesSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TrialListComponent);
    component = fixture.componentInstance;
    clinicalTrialsService = TestBed.inject(ClinicalTrialsService) as jasmine.SpyObj<ClinicalTrialsService>;
    favoritesService = TestBed.inject(FavoritesService) as jasmine.SpyObj<FavoritesService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with trials from service', () => {
    expect(component.trials).toEqual([mockTrial]);
    expect(clinicalTrialsService.getTrials).toHaveBeenCalled();
  });

  it('should initialize with favorites status from service', () => {
    expect(component.maxFavoritesReached).toBeFalse();
    expect(favoritesService.favorites$).toBeDefined();
  });

  describe('loading state', () => {
    it('should show loading spinner when loading', () => {
      loadingSubject.next(true);
      fixture.detectChanges();

      const spinner = fixture.debugElement.query(By.css('mat-spinner'));
      expect(spinner).toBeTruthy();
    });

    it('should hide loading spinner when not loading', () => {
      loadingSubject.next(false);
      fixture.detectChanges();

      const spinner = fixture.debugElement.query(By.css('mat-spinner'));
      expect(spinner).toBeFalsy();
    });

    it('should handle error state', () => {
      component.error = true;
      fixture.detectChanges();

      const errorMessage = fixture.debugElement.query(By.css('.error-message'));
      expect(errorMessage.nativeElement.textContent).toContain('Error loading trials');
    });
  });

  describe('auto-fetch functionality', () => {
    it('should start auto-fetch when enabled', fakeAsync(async () => {
      component.autoFetch = true;
      component.toggleAutoFetch({ checked: true });
      tick();

      expect(clinicalTrialsService.toggleTimer).toHaveBeenCalledWith(true);
      expect(snackBar.open).toHaveBeenCalledWith(
        'Auto-fetch started. Trials will update every 5 seconds.',
        '✕',
        jasmine.any(Object)
      );
    }));

    it('should stop auto-fetch when disabled', fakeAsync(async () => {
      component.autoFetch = false;
      component.toggleAutoFetch({ checked: false });
      tick();

      expect(clinicalTrialsService.toggleTimer).toHaveBeenCalledWith(false);
      expect(snackBar.open).toHaveBeenCalledWith(
        'Auto-fetch stopped.',
        '✕',
        jasmine.any(Object)
      );
    }));

    it('should handle error when toggling auto-fetch', fakeAsync(async () => {
      clinicalTrialsService.toggleTimer.and.returnValue(Promise.reject('Test error'));
      
      component.toggleAutoFetch({ checked: true });
      tick();

      expect(component.autoFetch).toBeFalse();
      expect(snackBar.open).toHaveBeenCalledWith(
        'Error toggling auto-fetch. Please try again.',
        '✕',
        jasmine.any(Object)
      );
    }));
  });

  describe('favorite functionality', () => {
    it('should prevent adding favorites when limit reached', () => {
      favoritesSubject.next(Array(10).fill(mockTrial));
      fixture.detectChanges();

      component.toggleFavorite({ ...mockTrial, isFavorite: false });

      expect(snackBar.open).toHaveBeenCalledWith(
        'Maximum favorites limit reached (10)',
        '✕',
        jasmine.any(Object)
      );
      expect(clinicalTrialsService.toggleFavorite).not.toHaveBeenCalled();
    });

    it('should show success message when adding favorite', () => {
      const trial = { ...mockTrial, isFavorite: false };
      component.toggleFavorite(trial);

      expect(clinicalTrialsService.toggleFavorite).toHaveBeenCalledWith(trial);
      expect(snackBar.open).toHaveBeenCalledWith(
        'Trial added to favorites',
        '✕',
        jasmine.any(Object)
      );
    });

    it('should show remove message when unfavoriting', () => {
      const trial = { ...mockTrial, isFavorite: true };
      component.toggleFavorite(trial);

      expect(clinicalTrialsService.toggleFavorite).toHaveBeenCalledWith(trial);
      expect(snackBar.open).toHaveBeenCalledWith(
        'Trial removed from favorites',
        '✕',
        jasmine.any(Object)
      );
    });

    it('should handle error when toggling favorite', () => {
      const trial = { ...mockTrial };
      clinicalTrialsService.toggleFavorite.and.returnValue(throwError(() => new Error('Test error')));

      component.toggleFavorite(trial);

      expect(snackBar.open).toHaveBeenCalledWith(
        'Error updating favorite status',
        '✕',
        jasmine.any(Object)
      );
    });
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
      const listButton = fixture.debugElement.query(By.css('mat-button-toggle[value="list"]'));
      listButton.triggerEventHandler('click', null);
      fixture.detectChanges();

      expect(component.viewMode).toBe('list');
    });
  });

  describe('navigation', () => {
    it('should navigate to trial details when clicking on trial card content', () => {
      const trial = { ...mockTrial };
      const cardContent = fixture.debugElement.query(By.css('.trial-content'));
      
      cardContent.nativeElement.click();
      component.viewTrialDetails(trial);
      
      expect(router.navigate).toHaveBeenCalledWith(['/trial', trial.nctId]);
    });

    it('should navigate to trial details when clicking on trial list content', () => {
      component.viewMode = 'list';
      fixture.detectChanges();
      
      const trial = { ...mockTrial };
      const listContent = fixture.debugElement.query(By.css('.trial-content'));
      
      listContent.nativeElement.click();
      component.viewTrialDetails(trial);
      
      expect(router.navigate).toHaveBeenCalledWith(['/trial', trial.nctId]);
    });

    it('should not navigate when clicking favorite button', () => {
      const trial = { ...mockTrial };
      const favoriteButton = fixture.debugElement.query(By.css('button[mat-icon-button]'));
      
      favoriteButton.triggerEventHandler('click', null);
      
      expect(router.navigate).not.toHaveBeenCalled();
      expect(clinicalTrialsService.toggleFavorite).toHaveBeenCalledWith(trial);
    });
  });

  describe('cleanup', () => {
    it('should stop timer and unsubscribe on destroy', fakeAsync(async () => {
      const subscriptionSpy = spyOn(component['subscriptions'][0], 'unsubscribe');
      
      await component.ngOnDestroy();
      tick();

      expect(clinicalTrialsService.toggleTimer).toHaveBeenCalledWith(false);
      expect(subscriptionSpy).toHaveBeenCalled();
    }));

    it('should handle error when stopping timer on destroy', fakeAsync(async () => {
      clinicalTrialsService.toggleTimer.and.returnValue(Promise.reject('Test error'));
      spyOn(console, 'error');
      
      await component.ngOnDestroy();
      tick();

      expect(console.error).toHaveBeenCalledWith('Error stopping timer:', 'Test error');
    }));
  });
});
