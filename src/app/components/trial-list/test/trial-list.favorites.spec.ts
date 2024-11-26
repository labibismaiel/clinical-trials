import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { TrialListComponent } from '../trial-list.component';
import { ClinicalTrialsService } from '../../../services/clinical-trials.service';
import { FavoritesService } from '../../../services/favorites.service';
import { MockTrialCardComponent, mockTrial, createTestSubjects } from './trial-list.test-utils';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

describe('TrialListComponent Favorites', () => {
  let component: TrialListComponent;
  let fixture: ComponentFixture<TrialListComponent>;
  let clinicalTrialsService: jasmine.SpyObj<ClinicalTrialsService>;
  let favoritesService: jasmine.SpyObj<FavoritesService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  const { trialsSubject, favoritesSubject, loadingSubject } = createTestSubjects();

  beforeEach(async () => {
    clinicalTrialsService = jasmine.createSpyObj('ClinicalTrialsService', {
      fetchInitialTrials: Promise.resolve(),
      getTrials: trialsSubject.asObservable(),
      getFavorites: favoritesSubject.asObservable(),
      getLoadingState: loadingSubject.asObservable(),
      toggleTimer: Promise.resolve(),
      toggleFavorite: Promise.resolve()
    });

    favoritesService = jasmine.createSpyObj('FavoritesService', [
      'getFavorites',
      'isMaxFavoritesReached',
      'addToFavorites',
      'removeFromFavorites'
    ], {
      favorites$: favoritesSubject.asObservable()
    });

    favoritesService.isMaxFavoritesReached.and.returnValue(false);
    favoritesService.addToFavorites.and.returnValue(undefined);
    favoritesService.removeFromFavorites.and.returnValue(undefined);

    snackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        NoopAnimationsModule,
        MatSnackBarModule,
        MatIconModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatSlideToggleModule,
        FormsModule,
        MatProgressSpinnerModule,
        TrialListComponent,
        MockTrialCardComponent
      ],
      providers: [
        { provide: ClinicalTrialsService, useValue: clinicalTrialsService },
        { provide: FavoritesService, useValue: favoritesService },
        { provide: MatSnackBar, useValue: snackBar }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TrialListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should toggle favorite status', fakeAsync(() => {
    // Set up initial state with no favorites
    favoritesSubject.next([]);
    fixture.detectChanges();
    tick();

    const updatedTrial = { ...mockTrial, isFavorite: true };
    clinicalTrialsService.toggleFavorite.and.returnValue(of(updatedTrial));

    component.toggleFavorite(mockTrial);
    tick();
    fixture.detectChanges();

    expect(clinicalTrialsService.toggleFavorite).toHaveBeenCalledWith(mockTrial);
  }));

  it('should update trial in list when favorite is toggled', fakeAsync(() => {
    const updatedTrial = { ...mockTrial, isFavorite: true };
    clinicalTrialsService.toggleFavorite.and.returnValue(of(updatedTrial));
    trialsSubject.next([mockTrial]);
    fixture.detectChanges();

    component.toggleFavorite(mockTrial);
    tick();
    fixture.detectChanges();

    expect(component.trials()[0].isFavorite).toBe(true);
  }));
});
