import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClinicalTrialsService } from '../../services/clinical-trials.service';
import { ClinicalTrial } from '../../models/clinical-trial.model';
import { Subscription } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-trial-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './trial-details.component.html',
  styleUrls: ['./trial-details.component.scss']
})
export class TrialDetailsComponent implements OnInit, OnDestroy {
  trial: ClinicalTrial | null = null;
  loading = true;
  error = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clinicalTrialsService: ClinicalTrialsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.route.params.subscribe(params => {
        const nctId = params['id'];
        if (nctId) {
          this.loadTrial(nctId);
        } else {
          this.router.navigate(['/']);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  public loadTrial(nctId: string) {
    this.loading = true;
    this.error = false;
    this.trial = null;

    this.subscriptions.push(
      this.clinicalTrialsService.getTrialById(nctId).subscribe({
        next: (trial) => {
          this.trial = trial;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading trial:', error);
          this.error = true;
          this.loading = false;
          this.trial = null;
          this.snackBar.open('Error loading trial details', '✕', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      })
    );
  }

  toggleFavorite(): void {
    if (!this.trial) return;

    const currentTrial = this.trial;

    this.clinicalTrialsService.toggleFavorite(currentTrial).pipe(
      tap((updatedTrial) => {
        this.trial = updatedTrial;
        const message = updatedTrial.isFavorite
          ? 'Trial added to favorites'
          : 'Trial removed from favorites';

        this.snackBar.open(message, '✕', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }),
      catchError((error) => {
        console.error('Error in toggleFavorite:', error);
        this.snackBar.open(
          'Error updating favorite status',
          '✕',
          { duration: 3000, panelClass: ['error-snackbar'] }
        );
        return of(currentTrial); // Return the original trial on error
      })
    ).subscribe();
  }

  goBack() {
    this.router.navigate(['/']);
  }

  private showNotification(message: string, type: 'success' | 'error' = 'success') {
    this.snackBar.open(message, '✕', {
      duration: 3000,
      panelClass: type === 'error' ? ['error-snackbar'] : ['success-snackbar']
    });
  }
}
