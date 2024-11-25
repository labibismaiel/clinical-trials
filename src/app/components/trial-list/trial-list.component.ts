import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClinicalTrialsService } from '../../services/clinical-trials.service';
import { FavoritesService } from '../../services/favorites.service';
import { ClinicalTrial } from '../../models/clinical-trial.model';
import { TrialCardComponent } from '../shared/trial-card/trial-card.component';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { Subscription, merge, EMPTY, catchError, tap } from 'rxjs';

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
  trials: ClinicalTrial[] = [];
  loading = false;
  error = false;
  autoFetch = false;
  viewMode: 'card' | 'list' = 'card';
  maxFavoritesReached = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private clinicalTrialsService: ClinicalTrialsService,
    private favoritesService: FavoritesService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.clinicalTrialsService.getTrials().subscribe(trials => {
        this.trials = trials;
      })
    );

    this.subscriptions.push(
      this.clinicalTrialsService.getLoadingState().subscribe(loading => {
        this.loading = loading;
      })
    );

    this.subscriptions.push(
      this.favoritesService.favorites$.subscribe(favorites => {
        this.maxFavoritesReached = favorites.length >= 10;
      })
    );

    // Initialize view mode
    this.viewMode = 'card';
    
    // Fetch initial trials
    this.clinicalTrialsService.fetchInitialTrials();
  }

  async ngOnDestroy(): Promise<void> {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.autoFetch) {
      try {
        await this.clinicalTrialsService.toggleTimer(false);
      } catch (error) {
        console.error('Error stopping timer:', error);
        // Don't rethrow the error since we're in cleanup
      }
    }
  }

  fetchTrials(): void {
    this.clinicalTrialsService.fetchInitialTrials();
  }

  async toggleAutoFetch(event: { checked: boolean }): Promise<void> {
    const wasEnabled = this.autoFetch;
    try {
      this.autoFetch = event.checked;
      await this.clinicalTrialsService.toggleTimer(event.checked);
    } catch (error) {
      console.error('Error toggling auto-fetch:', error);
      this.autoFetch = wasEnabled; // Restore previous state
      this.snackBar.open('Error toggling auto-fetch. Please try again.', 'Close', {
        duration: 3000
      });
    }
  }

  toggleFavorite(trial: ClinicalTrial): void {
    // Check for max favorites before attempting to favorite
    if (!trial.isFavorite && this.maxFavoritesReached) {
      this.snackBar.open('Maximum favorites limit reached (10)', 'Close', { duration: 3000 });
      return;
    }

    this.clinicalTrialsService.toggleFavorite(trial)
      .pipe(
        tap({
          error: (error) => {
            console.error('Error toggling favorite:', error);
            this.snackBar.open('Error updating favorite status', 'Close', { duration: 3000 });
          }
        })
      )
      .subscribe({
        next: (updatedTrial) => {
          const index = this.trials.findIndex(t => t.nctId === updatedTrial.nctId);
          if (index !== -1) {
            this.trials[index] = updatedTrial;
            this.trials = [...this.trials];
          }
        },
        error: () => {} // Handle error in tap operator
      });
  }

  viewTrialDetails(trial: ClinicalTrial): void {
    this.router.navigate(['/trial', trial.nctId]);
  }

  trackByTrialId(index: number, trial: ClinicalTrial): string {
    return trial.nctId;
  }

  private showNotification(message: string, type: 'success' | 'error' = 'success') {
    this.snackBar.open(message, '✕', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: type === 'error' ? ['error-snackbar'] : ['success-snackbar']
    });
  }
}
