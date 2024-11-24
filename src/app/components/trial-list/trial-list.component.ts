import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClinicalTrialsService } from '../../services/clinical-trials.service';
import { FavoritesService } from '../../services/favorites.service';
import { ClinicalTrial } from '../../models/clinical-trial.model';
import { Subscription, merge } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-trial-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    MatButtonToggleModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatTooltipModule
  ],
  templateUrl: './trial-list.component.html',
  styleUrls: ['./trial-list.component.scss']
})
export class TrialListComponent implements OnInit, OnDestroy {
  trials: ClinicalTrial[] = [];
  viewMode: 'card' | 'list' = 'card';
  maxFavoritesReached = false;
  loading = false;
  error = false;
  autoFetch = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private clinicalTrialsService: ClinicalTrialsService,
    private favoritesService: FavoritesService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit() {
    // Subscribe to trials
    this.subscriptions.push(
      this.clinicalTrialsService.getTrials().subscribe({
        next: (trials) => {
          console.log('Component received trials:', trials);
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

    // Subscribe to loading state
    this.subscriptions.push(
      this.clinicalTrialsService.getLoadingState().subscribe(
        isLoading => {
          console.log('Loading state changed:', isLoading);
          this.loading = isLoading;
        }
      )
    );

    // Subscribe to favorites
    this.subscriptions.push(
      this.favoritesService.favorites$.subscribe(favorites => {
        console.log('Favorites updated:', favorites);
        this.maxFavoritesReached = favorites.length >= 10;
      })
    );

    // Initial fetch
    this.fetchTrials();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.clinicalTrialsService.toggleTimer(false).catch(error => {
      console.error('Error stopping timer:', error);
    });
  }

  fetchTrials() {
    this.clinicalTrialsService.fetchInitialTrials();
  }

  async toggleAutoFetch(event?: any) {
    try {
      const newState = event ? event.checked : !this.autoFetch;
      console.log('Toggling auto-fetch:', newState);
      this.autoFetch = newState;
      await this.clinicalTrialsService.toggleTimer(this.autoFetch);
      
      this.showNotification(
        this.autoFetch 
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

  viewTrialDetails(trial: ClinicalTrial) {
    this.router.navigate(['/trial', trial.nctId]);
  }

  toggleFavorite(trial: ClinicalTrial) {
    if (!trial.isFavorite && this.maxFavoritesReached) {
      this.showNotification('Maximum favorites limit reached (10)', 'error');
      return;
    }

    this.clinicalTrialsService.toggleFavorite(trial).subscribe({
      next: (updatedTrial: ClinicalTrial) => {
        const index = this.trials.findIndex(t => t.nctId === updatedTrial.nctId);
        if (index !== -1) {
          this.trials[index] = updatedTrial;
        }
        this.showNotification(
          updatedTrial.isFavorite ? 'Trial added to favorites' : 'Trial removed from favorites'
        );
      },
      error: (error: Error) => {
        console.error('Error toggling favorite:', error);
        this.showNotification('Error updating favorite status', 'error');
      }
    });
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
