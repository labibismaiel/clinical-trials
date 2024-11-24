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
import { ClinicalTrialsService } from '../../services/clinical-trials.service';
import { FavoritesService } from '../../services/favorites.service';
import { ClinicalTrial } from '../../models/clinical-trial.model';
import { Subscription, interval } from 'rxjs';
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
    MatSlideToggleModule
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
    private snackBar: MatSnackBar,
    private router: Router,
    private favoritesService: FavoritesService
  ) {}

  ngOnInit() {
    this.fetchTrials();
    this.subscriptions.push(
      this.favoritesService.favorites$.subscribe(favorites => {
        this.maxFavoritesReached = favorites.length >= 10;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.clinicalTrialsService.toggleTimer(false);
  }

  fetchTrials() {
    this.loading = true;
    this.error = false;
    
    this.subscriptions.push(
      this.clinicalTrialsService.getTrials().subscribe({
        next: (trials) => {
          this.trials = trials;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error fetching trials:', error);
          this.error = true;
          this.loading = false;
          this.snackBar.open('Error fetching trials. Please try again later.', 'Close', {
            duration: 5000,
          });
        }
      })
    );
  }

  toggleAutoFetch(event?: any) {
    const newState = event ? event.checked : !this.autoFetch;
    this.autoFetch = newState;
    this.clinicalTrialsService.toggleTimer(this.autoFetch).then(() => {
      if (this.autoFetch) {
        this.snackBar.open('Auto-fetch started. Trials will update every 5 seconds.', 'Close', {
          duration: 3000,
        });
      } else {
        this.snackBar.open('Auto-fetch stopped.', 'Close', {
          duration: 3000,
        });
      }
    });
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

  private showNotification(message: string, type: 'success' | 'error' = 'success') {
    this.snackBar.open(message, '✕', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: type === 'error' ? ['error-snackbar'] : ['success-snackbar']
    });
  }
}
