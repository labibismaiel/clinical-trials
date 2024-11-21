import { Routes } from '@angular/router';
import { TrialListComponent } from './components/trial-list/trial-list.component';
import { FavoritesComponent } from './components/favorites/favorites.component';

export const routes: Routes = [
  { path: '', component: TrialListComponent },
  { path: 'favorites', component: FavoritesComponent },
  { path: '**', redirectTo: '' }
];
