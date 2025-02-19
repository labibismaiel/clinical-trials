import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { routes } from './app.routes';
import { TrialListComponent } from './components/trial-list/trial-list.component';
import { FavoritesComponent } from './components/favorites/favorites.component';
import { TrialDetailsComponent } from './components/trial-details/trial-details.component';

describe('App Routing', () => {
  let router: Router;
  let location: Location;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes(routes)],
      declarations: []
    });

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  it('should navigate to trial list by default', fakeAsync(() => {
    router.navigate(['']);
    tick();
    expect(location.path()).toBe('/');
  }));

  it('should navigate to favorites', fakeAsync(() => {
    router.navigate(['/favorites']);
    tick();
    expect(location.path()).toBe('/favorites');
  }));

  it('should navigate to trial details with ID', fakeAsync(() => {
    const testId = 'NCT123';
    router.navigate(['/trial', testId]);
    tick();
    expect(location.path()).toBe('/trial/' + testId);
  }));

  it('should redirect unknown paths to trial list', fakeAsync(() => {
    router.navigate(['/unknown']);
    tick();
    expect(location.path()).toBe('/');
  }));

  it('should have correct component for each route', () => {
    const trialListRoute = routes.find(route => route.path === '');
    const favoritesRoute = routes.find(route => route.path === 'favorites');
    const trialDetailsRoute = routes.find(route => route.path === 'trial/:id');
    const wildcardRoute = routes.find(route => route.path === '**');

    expect(trialListRoute?.component).toBe(TrialListComponent);
    expect(favoritesRoute?.component).toBe(FavoritesComponent);
    expect(trialDetailsRoute?.component).toBe(TrialDetailsComponent);
    expect(wildcardRoute?.redirectTo).toBe('');
  });
});
