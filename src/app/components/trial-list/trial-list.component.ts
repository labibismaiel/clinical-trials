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
import { Subscription, merge } from 'rxjs';

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
    this.fetchTrials();
    this.subscribeToFavorites();
    this.subscribeToTrials();
    this.subscribeToLoadingState();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.clinicalTrialsService.toggleTimer(false).catch(error => {
      console.error('Error stopping timer:', error);
    });
  }

  fetchTrials(): void {
    this.clinicalTrialsService.fetchInitialTrials();
  }

  toggleAutoFetch(event: { checked: boolean }): void {
    try {
      const newState = event.checked;
      this.autoFetch = newState;
      this.clinicalTrialsService.toggleTimer(newState);
      this.showNotification(
        newState 
          ? 'Auto-fetch started. Trials will update every 5 seconds.' 
          : 'Auto-fetch stopped.',
        'success'
      );
    } catch (error) {
      console.error('Error toggling auto-fetch:', error);
      this.autoFetch = false;
      this.showNotification('Error toggling auto-fetch. Please try again.', 'error');
    }
  }

  toggleFavorite(trial: ClinicalTrial): void {
    if (!trial.isFavorite && this.maxFavoritesReached) {
      this.showNotification('Maximum favorites limit reached (10)', 'error');
      return;
    }

    this.clinicalTrialsService.toggleFavorite(trial).subscribe({
      next: (updatedTrial) => {
        const index = this.trials.findIndex(t => t.nctId === updatedTrial.nctId);
        if (index !== -1) {
          this.trials[index] = updatedTrial;
          this.trials = [...this.trials];
        }
      },
      error: (error) => {
        console.error('Error toggling favorite:', error);
        this.showNotification('Error updating favorite status', 'error');
      }
    });
  }

  viewTrialDetails(trial: ClinicalTrial): void {
    this.router.navigate(['/trial', trial.nctId]);
  }

  trackByTrialId(index: number, trial: ClinicalTrial): string {
    return trial.nctId;
  }

  private subscribeToFavorites(): void {
    this.subscriptions.push(
      this.favoritesService.favorites$.subscribe(favorites => {
        this.maxFavoritesReached = favorites.length >= 10;
      })
    );
  }

  private subscribeToTrials(): void {
    this.subscriptions.push(
      this.clinicalTrialsService.getTrials().subscribe({
        next: (trials) => {
          this.trials = trials;
          this.error = false;
        },
        error: (error) => {
          console.error('Error fetching trials:', error);
          this.error = true;
          this.showNotification('Error fetching trials. Please try again later.', 'error');
        }
      })
    );
  }

  private subscribeToLoadingState(): void {
    this.subscriptions.push(
      this.clinicalTrialsService.getLoadingState().subscribe(
        isLoading => {
          this.loading = isLoading;
        }
      )
    );
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
