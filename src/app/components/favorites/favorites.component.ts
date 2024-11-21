import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ClinicalTrialsService } from '../../services/clinical-trials.service';
import { ClinicalTrial } from '../../models/clinical-trial.model';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss']
})
export class FavoritesComponent implements OnInit {
  favorites: ClinicalTrial[] = [];

  constructor(private clinicalTrialsService: ClinicalTrialsService) {}

  ngOnInit() {
    this.clinicalTrialsService.getFavorites().subscribe(favorites => {
      this.favorites = favorites;
    });
  }

  removeFavorite(trial: ClinicalTrial) {
    this.clinicalTrialsService.toggleFavorite(trial);
  }
}
