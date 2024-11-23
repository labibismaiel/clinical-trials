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

  private loadTrial(nctId: string) {
    this.loading = true;
    this.error = false;

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
          this.showNotification('Error loading trial details', 'error');
        }
      })
    );
  }

  toggleFavorite() {
    if (!this.trial) return;

    this.clinicalTrialsService.toggleFavorite(this.trial);
    this.trial.isFavorite = !this.trial.isFavorite;
    this.showNotification(
      this.trial.isFavorite ? 'Trial added to favorites' : 'Trial removed from favorites'
    );
  }

  goBack() {
    this.router.navigate(['/']);
  }

  private showNotification(message: string, type: 'success' | 'error' = 'success') {
    this.snackBar.open(message, '✕', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: [type === 'error' ? 'error-snackbar' : 'success-snackbar']
    });
  }
}
