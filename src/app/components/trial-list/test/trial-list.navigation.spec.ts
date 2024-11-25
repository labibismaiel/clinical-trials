import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { TrialListComponent } from '../trial-list.component';
import { ClinicalTrialsService } from '../../../services/clinical-trials.service';
import { FavoritesService } from '../../../services/favorites.service';
import { MockTrialCardComponent, mockTrial, createTestSubjects } from './trial-list.test-utils';

describe('TrialListComponent Navigation', () => {
  let component: TrialListComponent;
  let fixture: ComponentFixture<TrialListComponent>;
  let clinicalTrialsService: jasmine.SpyObj<ClinicalTrialsService>;
  let favoritesService: jasmine.SpyObj<FavoritesService>;
  let router: jasmine.SpyObj<Router>;
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

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
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
    fixture.detectChanges();
  });

  it('should navigate to trial details when trial is clicked', () => {
    component.viewTrialDetails(mockTrial);
    expect(router.navigate).toHaveBeenCalledWith(['/trial', mockTrial.nctId]);
  });

  it('should navigate to trial details when trial card emits trialClicked', fakeAsync(() => {
    // Add trials to the component first
    trialsSubject.next([mockTrial]); // Use subject to emit trials
    component.viewMode = 'card';
    component.loading = false;
    component.error = false;
    fixture.detectChanges();
    tick(); // Wait for async operations

    // Find the trial card
    const trialCard = fixture.debugElement.query(By.directive(MockTrialCardComponent));
    expect(trialCard).toBeTruthy('Trial card component should be found');
    
    // Emit the trialClicked event
    trialCard.componentInstance.trialClicked.emit(mockTrial);
    tick();
    
    expect(router.navigate).toHaveBeenCalledWith(['/trial', mockTrial.nctId]);
  }));
});
