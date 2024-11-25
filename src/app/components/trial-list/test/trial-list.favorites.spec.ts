import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { of, throwError, Observable } from 'rxjs';
import { TrialListComponent } from '../trial-list.component';
import { ClinicalTrialsService } from '../../../services/clinical-trials.service';
import { FavoritesService } from '../../../services/favorites.service';
import { MockTrialCardComponent, mockTrial, createTestSubjects } from './trial-list.test-utils';
import { By } from '@angular/platform-browser';

describe('TrialListComponent Favorites', () => {
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
        RouterTestingModule,
        MatSnackBarModule,
        MatSlideToggleModule,
        MatButtonToggleModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        MatCardModule,
        FormsModule
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

  it('should toggle favorite status', fakeAsync(() => {
    const updatedTrial = { ...mockTrial, isFavorite: true };
    clinicalTrialsService.toggleFavorite.and.returnValue(of(updatedTrial));

    component.toggleFavorite(mockTrial);
    tick();

    expect(clinicalTrialsService.toggleFavorite).toHaveBeenCalledWith(mockTrial);
  }));

  it('should show error message when toggling favorite fails', fakeAsync(() => {
    // Arrange
    const error = new Error('Toggle failed');
    clinicalTrialsService.toggleFavorite.and.returnValue(throwError(() => error));

    // Act
    component.toggleFavorite(mockTrial);
    tick(); // Allow error handling to complete
    fixture.detectChanges();

    // Assert
    expect(clinicalTrialsService.toggleFavorite).toHaveBeenCalledWith(mockTrial);
    expect(snackBar.open).toHaveBeenCalledWith(
      'Error updating favorite status',
      'Close',
      { duration: 3000 }
    );
  }));

  it('should show max favorites message when limit is reached', fakeAsync(() => {
    // Set maxFavoritesReached to true by emitting 10 favorites
    const favorites = Array(10).fill(mockTrial);
    favoritesSubject.next(favorites);
    tick(); // Wait for subscription update

    // Try to favorite another trial
    const trialToFavorite = { ...mockTrial, isFavorite: false };
    component.toggleFavorite(trialToFavorite);

    // Verify the error message and that the service wasn't called
    expect(snackBar.open).toHaveBeenCalledWith(
      'Maximum favorites limit reached (10)',
      'Close',
      { duration: 3000 }
    );
    expect(clinicalTrialsService.toggleFavorite).not.toHaveBeenCalled();
  }));

  it('should update trial in list when favorite is toggled', fakeAsync(() => {
    const updatedTrial = { ...mockTrial, isFavorite: true };
    clinicalTrialsService.toggleFavorite.and.returnValue(of(updatedTrial));
    trialsSubject.next([mockTrial]);
    fixture.detectChanges();

    component.toggleFavorite(mockTrial);
    tick();
    fixture.detectChanges();

    expect(component.trials[0].isFavorite).toBe(true);
  }));
});
