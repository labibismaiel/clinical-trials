import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TrialListComponent } from '../trial-list.component';
import { ClinicalTrialsService } from '../../../services/clinical-trials.service';
import { FavoritesService } from '../../../services/favorites.service';
import { MockTrialCardComponent, mockTrial, createTestSubjects } from './trial-list.test-utils';

describe('TrialListComponent Auto-Fetch', () => {
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

    const favoritesSpy = jasmine.createSpyObj('FavoritesService', [
      'getFavorites',
      'isMaxFavoritesReached',
      'addToFavorites',
      'removeFromFavorites'
    ], {
      favorites$: favoritesSubject.asObservable()
    });

    favoritesSpy.isMaxFavoritesReached.and.returnValue(false);

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

  it('should enable auto-fetch when toggle is checked', fakeAsync(async () => {
    const mockToggleEvent = {
      checked: true,
      source: {} as any
    };
    await component.toggleAutoFetch(mockToggleEvent);
    tick();

    expect(clinicalTrialsService.toggleTimer).toHaveBeenCalledWith(true);
    expect(component.autoFetch()).toBe(true);

    discardPeriodicTasks();
  }));

  it('should disable auto-fetch when toggle is unchecked', fakeAsync(async () => {
    component.autoFetch.set(true);
    const mockToggleEvent = {
      checked: false,
      source: {} as any
    };
    await component.toggleAutoFetch(mockToggleEvent);
    tick();

    expect(clinicalTrialsService.toggleTimer).toHaveBeenCalledWith(false);
    expect(component.autoFetch()).toBe(false);
  }));


  it('should cleanup timer subscription on destroy', fakeAsync(async () => {
    component.autoFetch.set(true);
    component.ngOnDestroy();
    tick();

    expect(clinicalTrialsService.toggleTimer).toHaveBeenCalledWith(false);
    expect(component.autoFetch()).toBe(true);
  }));
});
