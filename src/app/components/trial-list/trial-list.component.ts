import { Component, OnInit, OnDestroy, signal, WritableSignal, computed, ChangeDetectorRef, NgZone } from '@angular/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { Subscription, interval, Subject } from 'rxjs';
import { ClinicalTrialsService } from '../../services/clinical-trials.service';
import { ClinicalTrial } from '../../models/clinical-trial.model';
import { FavoritesService } from '../../services/favorites.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { TrialCardComponent } from '../shared/trial-card/trial-card.component';

@Component({
  selector: 'app-trial-list',
  templateUrl: './trial-list.component.html',
  styleUrls: ['./trial-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSlideToggleModule,
    MatButtonToggleModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatCardModule,
    MatSnackBarModule,
    TrialCardComponent
  ]
})
export class TrialListComponent implements OnInit, OnDestroy {
  trials: WritableSignal<ClinicalTrial[]> = signal([]);
  loading: WritableSignal<boolean> = signal(false);
  error: WritableSignal<boolean> = signal(false);
  autoFetch: WritableSignal<boolean> = signal(false);
  maxFavoritesReached: WritableSignal<boolean> = signal(false);
  viewMode: WritableSignal<'card' | 'list'> = signal('card');

  private fetchTrialsSubject = new Subject<void>();
  private readonly AUTO_FETCH_INTERVAL = 5000; // 5 seconds
  private subscriptions: Subscription[] = [];

  constructor(
    private clinicalTrialsService: ClinicalTrialsService,
    private favoritesService: FavoritesService,
    private router: Router,
    private snackBar: MatSnackBar,
    private ngZone: NgZone
  ) {
    // Subscribe to the fetchTrials subject
    this.subscriptions.push(
      this.fetchTrialsSubject.subscribe(() => this.performFetchTrials())
    );
  }

  ngOnInit(): void {
    this.fetchTrials();
    this.updateMaxFavoritesReached();
    this.subscriptions.push(
      this.clinicalTrialsService.getLoadingState().subscribe(isLoading => {
        this.ngZone.run(() => {
          this.loading.set(isLoading);
        });
      })
    );

    this.subscriptions.push(
      this.favoritesService.favorites$.subscribe(favorites => {
        this.ngZone.run(() => {
          this.maxFavoritesReached.set(favorites.length >= 10);
        });
      })
    );

    this.subscriptions.push(
      this.clinicalTrialsService.getTrials().subscribe(trials => {
        this.ngZone.run(() => {
          this.trials.set(trials);
        });
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  fetchTrials(): void {
    this.fetchTrialsSubject.next();
  }

  private performFetchTrials(): void {
    this.loading.set(true);
    this.error.set(false);

    this.ngZone.run(() => {
      this.clinicalTrialsService.fetchInitialTrials().subscribe({
        next: (trials) => {
          this.trials.set(trials);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error fetching trials:', err);
          this.error.set(true);
          this.loading.set(false);
        }
      });
    });
  }

  toggleAutoFetch(event: MatSlideToggleChange): void {
    this.autoFetch.set(event.checked);
    this.clinicalTrialsService.toggleTimer(event.checked)
      .catch(error => {
        console.error('Error toggling auto-fetch:', error);
        this.autoFetch.set(false);
        this.snackBar.open('Failed to toggle auto-fetch', 'Close', { duration: 3000 });
      });
  }

  toggleFavorite(trial: ClinicalTrial): void {
    if (!trial.isFavorite && this.maxFavoritesReached()) {
      this.snackBar.open('Maximum favorites reached (10)', 'Close', { duration: 3000 });
      return;
    }

    this.clinicalTrialsService.toggleFavorite(trial).subscribe({
      next: (updatedTrial) => {
        this.updateMaxFavoritesReached();
      },
      error: (error) => {
        console.error('Error toggling favorite:', error);
        this.snackBar.open('Failed to update favorite', 'Close', { duration: 3000 });
      }
    });
  }

  private updateMaxFavoritesReached(): void {
    this.maxFavoritesReached.set(this.favoritesService.isMaxFavoritesReached());
  }

  viewTrialDetails(trial: ClinicalTrial): void {
    this.router.navigate(['/trial', trial.nctId]);
  }

  trackByTrialId(index: number, trial: ClinicalTrial): string {
    return trial.nctId;
  }
}
