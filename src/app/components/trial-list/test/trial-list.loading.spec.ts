import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TrialListComponent } from '../trial-list.component';
import { ClinicalTrialsService } from '../../../services/clinical-trials.service';
import { FavoritesService } from '../../../services/favorites.service';
import { MockTrialCardComponent, mockTrial, createTestSubjects } from './trial-list.test-utils';

describe('TrialListComponent Loading', () => {
  let component: TrialListComponent;
  let fixture: ComponentFixture<TrialListComponent>;
  let clinicalTrialsService: jasmine.SpyObj<ClinicalTrialsService>;
  let favoritesService: jasmine.SpyObj<FavoritesService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  const { trialsSubject, favoritesSubject, loadingSubject } = createTestSubjects();

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

    const favoritesSpy = jasmine.createSpyObj('FavoritesService', ['getFavorites'], {
      favorites$: favoritesSubject.asObservable()
    });

    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        TrialListComponent,
        MockTrialCardComponent,
        NoopAnimationsModule,
        RouterTestingModule
      ],
      providers: [
        { provide: ClinicalTrialsService, useValue: serviceSpy },
        { provide: FavoritesService, useValue: favoritesSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    clinicalTrialsService = TestBed.inject(ClinicalTrialsService) as jasmine.SpyObj<ClinicalTrialsService>;
    favoritesService = TestBed.inject(FavoritesService) as jasmine.SpyObj<FavoritesService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    
    fixture = TestBed.createComponent(TrialListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with default values', fakeAsync(() => {
    // Reset trials to initial value
    trialsSubject.next([mockTrial]);
    tick();
    fixture.detectChanges();

    expect(component.trials).toEqual([mockTrial]);
    expect(component.loading).toBeFalse();
    expect(component.error).toBeFalse();
    expect(component.autoFetch).toBeFalse();
    expect(component.viewMode).toBe('card');
  }));

  it('should fetch initial trials on init', () => {
    expect(clinicalTrialsService.fetchInitialTrials).toHaveBeenCalled();
  });

  it('should update loading state from service', fakeAsync(() => {
    loadingSubject.next(true);
    tick();
    fixture.detectChanges();
    
    expect(component.loading).toBeTrue();
    
    loadingSubject.next(false);
    tick();
    fixture.detectChanges();
    
    expect(component.loading).toBeFalse();
  }));

  it('should update trials from service', fakeAsync(() => {
    const newTrials = [
      { ...mockTrial, nctId: 'NCT456' },
      { ...mockTrial, nctId: 'NCT789' }
    ];
    
    trialsSubject.next(newTrials);
    tick();
    fixture.detectChanges();
    
    expect(component.trials).toEqual(newTrials);
  }));

  it('should fetch trials manually', () => {
    component.fetchTrials();
    expect(clinicalTrialsService.fetchInitialTrials).toHaveBeenCalled();
  });
});
