import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { By } from '@angular/platform-browser';
import { TrialListComponent } from '../trial-list.component';
import { ClinicalTrialsService } from '../../../services/clinical-trials.service';
import { MockTrialCardComponent, mockTrial, createTestSubjects } from './trial-list.test-utils';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TrialCardComponent } from '../../shared/trial-card/trial-card.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('TrialListComponent Navigation', () => {
  let component: TrialListComponent;
  let fixture: ComponentFixture<TrialListComponent>;
  let router: jasmine.SpyObj<Router>;
  let clinicalTrialsService: jasmine.SpyObj<ClinicalTrialsService>;
  const { trialsSubject, favoritesSubject, loadingSubject } = createTestSubjects();

  beforeEach(async () => {
    router = jasmine.createSpyObj('Router', ['navigate']);
    clinicalTrialsService = jasmine.createSpyObj('ClinicalTrialsService', {
      fetchInitialTrials: undefined,
      getTrials: trialsSubject.asObservable(),
      getFavorites: favoritesSubject.asObservable(),
      getLoadingState: loadingSubject.asObservable(),
      toggleTimer: Promise.resolve(),
      toggleFavorite: Promise.resolve()
    });

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
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
        { provide: Router, useValue: router },
        { provide: ClinicalTrialsService, useValue: clinicalTrialsService },
        { provide: MatSnackBar, useValue: jasmine.createSpyObj('MatSnackBar', ['open']) }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TrialListComponent);
    component = fixture.componentInstance;
    component.viewMode.set('card');
    component.loading.set(false);
    component.error.set(false);

    trialsSubject.next([mockTrial]);
    loadingSubject.next(false);
    fixture.detectChanges();
  });

  it('should navigate to trial details when trial is clicked', fakeAsync(() => {
    // Set initial state
    trialsSubject.next([mockTrial]);
    loadingSubject.next(false);
    fixture.detectChanges();
    tick();

    // Call viewTrialDetails directly
    component.viewTrialDetails(mockTrial);
    tick();

    expect(router.navigate).toHaveBeenCalledWith(['/trial', mockTrial.nctId]);
  }));
});
