import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClinicalTrial } from '../../../models/clinical-trial.model';

@Component({
  selector: 'app-trial-card',
  templateUrl: './trial-card.component.html',
  styleUrls: ['./trial-card.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ]
})
export class TrialCardComponent {
  @Input() trial!: ClinicalTrial;
  @Input() viewMode: 'card' | 'list' = 'card';
  @Input() maxFavoritesReached = false;
  @Output() favoriteToggled = new EventEmitter<ClinicalTrial>();

  constructor(private router: Router) {}

  toggleFavorite(event: Event): void {
    event.stopPropagation();
    this.favoriteToggled.emit(this.trial);
  }

  viewTrialDetails(): void {
    if (this.trial?.nctId) {
      this.router.navigate(['/trial', this.trial.nctId]);
    }
  }
}
