import { TestBed } from '@angular/core/testing';
import { FavoritesService } from './favorites.service';
import { ClinicalTrial } from '../models/clinical-trial.model';

describe('FavoritesService', () => {
  let service: FavoritesService;

  const mockTrial: ClinicalTrial = {
    nctId: 'NCT123',
    briefTitle: 'Test Trial',
    officialTitle: 'Official Test Trial',
    overallStatus: 'Recruiting',
    phase: 'Phase 1',
    studyType: 'Interventional',
    condition: 'Test Condition',
    lastUpdatePosted: '2023-01-01',
    isFavorite: false
  };

  beforeEach(() => {
    const store: { [key: string]: string } = {};
    
    // Create base spies for localStorage
    jasmine.getEnv().allowRespy(true); // Allow respying in the same test
    
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      return store[key] ?? null;
    });
    
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
      store[key] = value;
    });
    
    spyOn(localStorage, 'removeItem').and.callFake((key: string) => {
      delete store[key];
    });

    TestBed.configureTestingModule({
      providers: [FavoritesService]
    });
  });

  it('should be created', () => {
    service = TestBed.inject(FavoritesService);
    expect(service).toBeTruthy();
  });

  it('should initialize with empty favorites if none in localStorage', () => {
    service = TestBed.inject(FavoritesService);
    
    service.favorites$.subscribe(favorites => {
      expect(favorites).toEqual([]);
      expect(favorites.length).toBe(0);
    });
  });

  it('should initialize with favorites from localStorage', () => {
    // Set up localStorage before creating service
    localStorage.setItem('favoriteTrials', JSON.stringify([mockTrial]));

    // Create service after localStorage is set up
    service = TestBed.inject(FavoritesService);

    let favorites: ClinicalTrial[] = [];
    service.favorites$.subscribe(favs => {
      favorites = favs;
    });

    expect(favorites.length).toBe(1);
    expect(favorites[0]).toEqual(mockTrial);
  });

  it('should add a trial to favorites', () => {
    service = TestBed.inject(FavoritesService);
    service.addToFavorites(mockTrial);
    
    service.favorites$.subscribe(favorites => {
      expect(favorites).toContain(jasmine.objectContaining({
        nctId: mockTrial.nctId,
        isFavorite: true
      }));
    });
  });

  it('should not add duplicate trials to favorites', () => {
    service = TestBed.inject(FavoritesService);
    service.addToFavorites(mockTrial);
    service.addToFavorites(mockTrial);
    
    service.favorites$.subscribe(favorites => {
      expect(favorites.length).toBe(1);
    });
  });

  it('should throw error when adding beyond max favorites limit', () => {
    // Add 10 trials first
    service = TestBed.inject(FavoritesService);
    for (let i = 0; i < 10; i++) {
      service.addToFavorites({ ...mockTrial, nctId: `NCT${i}` });
    }

    // Try to add one more
    expect(() => service.addToFavorites({ ...mockTrial, nctId: 'NCT11' }))
      .toThrowError('Maximum number of favorites (10) reached');
  });

  it('should remove a trial from favorites', () => {
    service = TestBed.inject(FavoritesService);
    service.addToFavorites(mockTrial);
    service.removeFromFavorites(mockTrial.nctId);
    
    service.favorites$.subscribe(favorites => {
      expect(favorites).not.toContain(jasmine.objectContaining({
        nctId: mockTrial.nctId
      }));
    });
  });

  it('should check if a trial is favorite', () => {
    service = TestBed.inject(FavoritesService);
    service.addToFavorites(mockTrial);
    expect(service.isFavorite(mockTrial.nctId)).toBeTrue();
    
    service.removeFromFavorites(mockTrial.nctId);
    expect(service.isFavorite(mockTrial.nctId)).toBeFalse();
  });

  it('should get favorites count', () => {
    service = TestBed.inject(FavoritesService);
    expect(service.getFavoritesCount()).toBe(0);
    
    service.addToFavorites(mockTrial);
    expect(service.getFavoritesCount()).toBe(1);
  });

  it('should clear all favorites', () => {
    service = TestBed.inject(FavoritesService);
    service.addToFavorites(mockTrial);
    service.clearFavorites();
    
    service.favorites$.subscribe(favorites => {
      expect(favorites).toEqual([]);
    });
    expect(localStorage.removeItem).toHaveBeenCalled();
  });

  it('should handle localStorage errors when saving', () => {
    service = TestBed.inject(FavoritesService);
    
    // Create new spy that throws error
    spyOn(localStorage, 'setItem').and.throwError('Storage error');
    
    expect(() => {
      service.addToFavorites(mockTrial);
    }).toThrowError('Failed to save favorites');
  });

  it('should handle localStorage errors when clearing', () => {
    service = TestBed.inject(FavoritesService);
    
    // Create new spy that throws error
    spyOn(localStorage, 'removeItem').and.throwError('Storage error');
    
    expect(() => service.clearFavorites())
      .toThrowError('Failed to clear favorites');
  });
});
