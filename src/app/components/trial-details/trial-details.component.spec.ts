import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TrialDetailsComponent } from './trial-details.component';
import { ClinicalTrialsService } from '../../services/clinical-trials.service';
import { ClinicalTrial } from '../../models/clinical-trial.model';

describe('TrialDetailsComponent', () => {
  let component: TrialDetailsComponent;
  let fixture: ComponentFixture<TrialDetailsComponent>;
  let clinicalTrialsService: jasmine.SpyObj<ClinicalTrialsService>;

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

  beforeEach(() => {
    clinicalTrialsService = jasmine.createSpyObj('ClinicalTrialsService', ['getTrialById', 'toggleFavorite']);

    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        TrialDetailsComponent
      ],
      providers: [
        { provide: ClinicalTrialsService, useValue: clinicalTrialsService },
        { provide: ActivatedRoute, useValue: { params: of({ id: 'NCT123' }) } },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) }
      ]
    });

    fixture = TestBed.createComponent(TrialDetailsComponent);
    component = fixture.componentInstance;

    // Setup default successful response
    clinicalTrialsService.getTrialById.and.returnValue(of(mockTrial));

    fixture.detectChanges();
  });

  describe('toggleFavorite', () => {
    beforeEach(fakeAsync(() => {
      // Reset spies
      clinicalTrialsService.toggleFavorite.calls.reset();
      clinicalTrialsService.getTrialById.calls.reset();

      // Setup initial trial data
      clinicalTrialsService.getTrialById.and.returnValue(of(mockTrial));
      component.loadTrial('NCT123');
      tick();
      fixture.detectChanges();
    }));

    it('should not call service if trial is null', fakeAsync(() => {
      component.trial = null;
      component.toggleFavorite();
      tick();
      expect(clinicalTrialsService.toggleFavorite).not.toHaveBeenCalled();
    }));

    it('should update trial when toggling favorite succeeds', fakeAsync(() => {
      const updatedTrial = { ...mockTrial, isFavorite: true };
      clinicalTrialsService.toggleFavorite.and.returnValue(of(updatedTrial));

      component.toggleFavorite();
      tick();
      fixture.detectChanges();

      expect(clinicalTrialsService.toggleFavorite).toHaveBeenCalledWith(mockTrial);
      expect(component.trial).toEqual(updatedTrial);
    }));

    it('should handle error when toggling favorite fails', fakeAsync(() => {
      const initialTrial = { ...mockTrial };
      component.trial = initialTrial;
      clinicalTrialsService.toggleFavorite.and.returnValue(throwError(() => new Error('Test error')));

      component.toggleFavorite();
      tick();
      fixture.detectChanges();

      expect(clinicalTrialsService.toggleFavorite).toHaveBeenCalledWith(initialTrial);
      expect(component.trial).toEqual(initialTrial);
    }));

    it('should handle removing from favorites', fakeAsync(() => {
      const favorited = { ...mockTrial, isFavorite: true };
      const unfavorited = { ...mockTrial, isFavorite: false };

      component.trial = favorited;
      clinicalTrialsService.toggleFavorite.and.returnValue(of(unfavorited));

      component.toggleFavorite();
      tick();
      fixture.detectChanges();

      expect(clinicalTrialsService.toggleFavorite).toHaveBeenCalledWith(favorited);
      expect(component.trial).toEqual(unfavorited);
    }));
  });
});
