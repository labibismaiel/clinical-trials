import { Routes } from '@angular/router';
import { TrialListComponent } from './components/trial-list/trial-list.component';
import { FavoritesComponent } from './components/favorites/favorites.component';
import { TrialDetailsComponent } from './components/trial-details/trial-details.component';

export const routes: Routes = [
  { path: '', component: TrialListComponent },
  { path: 'trial/:id', component: TrialDetailsComponent },
  { path: 'favorites', component: FavoritesComponent },
  { path: '**', redirectTo: '' }
];
