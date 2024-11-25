import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { Router } from '@angular/router';
import { FavoritesComponent } from './favorites.component';
import { FavoritesService } from '../../services/favorites.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClinicalTrial } from '../../models/clinical-trial.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { TrialCardComponent } from '../shared/trial-card/trial-card.component';

describe('FavoritesComponent', () => {
  let component: FavoritesComponent;
  let fixture: ComponentFixture<FavoritesComponent>;
  let favoritesService: jasmine.SpyObj<FavoritesService>;
  let router: jasmine.SpyObj<Router>;
  let favoritesSubject: BehaviorSubject<ClinicalTrial[]>;

  beforeEach(async () => {
    favoritesSubject = new BehaviorSubject<ClinicalTrial[]>([]);
    favoritesService = jasmine.createSpyObj('FavoritesService', ['removeFromFavorites'], {
      favorites$: favoritesSubject.asObservable()
    });
    router = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [FavoritesComponent],
      providers: [
        { provide: FavoritesService, useValue: favoritesService },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FavoritesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('loading state', () => {
    it('should show empty state when no favorites', () => {
      component.loading = false;
      favoritesSubject.next([]);
      fixture.detectChanges();

      const emptyState = fixture.debugElement.query(By.css('[data-testid="no-favorites"]'));
      expect(emptyState).toBeTruthy();
      expect(emptyState.nativeElement.textContent).toContain("You haven't added any trials to your favorites yet");
    });
  });

  describe('removeFavorite', () => {
    it('should remove trial from favorites', () => {
      const mockTrial = {
        nctId: 'NCT12345',
        briefTitle: 'Test Trial',
        officialTitle: 'Test Trial Official',
        overallStatus: 'Recruiting',
        phase: 'Phase 1',
        studyType: 'Interventional',
        condition: 'Test Condition',
        lastUpdatePosted: '2023-01-01',
        isFavorite: true
      };

      component.removeFavorite(mockTrial);
      expect(favoritesService.removeFromFavorites).toHaveBeenCalledWith(mockTrial.nctId);
    });
  });

  describe('view mode', () => {
    it('should initialize with card view', () => {
      expect(component.viewMode).toBe('card');
    });

    it('should update view mode', () => {
      component.viewMode = 'list';
      fixture.detectChanges();
      expect(component.viewMode).toBe('list');
    });
  });
});
