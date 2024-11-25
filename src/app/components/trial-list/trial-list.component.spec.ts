import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { TrialListComponent } from './trial-list.component';
import { ClinicalTrialsService } from '../../services/clinical-trials.service';
import { FavoritesService } from '../../services/favorites.service';
import { ClinicalTrial } from '../../models/clinical-trial.model';

describe('TrialListComponent', () => {
  let component: TrialListComponent;
  let fixture: ComponentFixture<TrialListComponent>;
  let router: jasmine.SpyObj<Router>;
  let clinicalTrialsService: jasmine.SpyObj<ClinicalTrialsService>;
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
    enrollment: 100,
    interventions: ['Test intervention'],
    locations: ['Test location']
  };

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const clinicalTrialsServiceSpy = jasmine.createSpyObj('ClinicalTrialsService',
      ['getTrials', 'getLoadingState', 'fetchInitialTrials', 'toggleTimer', 'toggleFavorite'],
      { loading: false }
    );
    const favoritesServiceSpy = jasmine.createSpyObj('FavoritesService', ['getFavorites'], {
      favorites$: of([])
    });
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        TrialListComponent
      ],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ClinicalTrialsService, useValue: clinicalTrialsServiceSpy },
        { provide: FavoritesService, useValue: favoritesServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    clinicalTrialsService = TestBed.inject(ClinicalTrialsService) as jasmine.SpyObj<ClinicalTrialsService>;
    favoritesService = TestBed.inject(FavoritesService) as jasmine.SpyObj<FavoritesService>;

    clinicalTrialsService.getTrials.and.returnValue(of([]));
    clinicalTrialsService.getLoadingState.and.returnValue(of(false));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TrialListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Navigation', () => {
    it('should navigate to trial details when viewTrialDetails is called', fakeAsync(() => {
      // Setup
      const trial = mockTrial;

      // Execute
      component.viewTrialDetails(trial);
      tick();

      // Verify
      expect(router.navigate).toHaveBeenCalledWith(['/trial', trial.nctId]);
    }));
  });
});
