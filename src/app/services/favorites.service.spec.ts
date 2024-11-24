import { TestBed } from '@angular/core/testing';
import { FavoritesService } from './favorites.service';
import { ClinicalTrial } from '../models/clinical-trial.model';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let localStorageSpy: jasmine.SpyObj<Storage>;

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
    localStorageSpy = jasmine.createSpyObj('Storage', ['getItem', 'setItem', 'removeItem']);
    spyOn(window.localStorage, 'getItem').and.callFake(localStorageSpy.getItem);
    spyOn(window.localStorage, 'setItem').and.callFake(localStorageSpy.setItem);
    spyOn(window.localStorage, 'removeItem').and.callFake(localStorageSpy.removeItem);

    TestBed.configureTestingModule({
      providers: [FavoritesService]
    });
    service = TestBed.inject(FavoritesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with empty favorites if none in localStorage', () => {
    localStorageSpy.getItem.and.returnValue(null);
    service = TestBed.inject(FavoritesService);
    
    service.favorites$.subscribe(favorites => {
      expect(favorites).toEqual([]);
    });
  });

  it('should initialize with favorites from localStorage', () => {
    const storedFavorites = [mockTrial];
    localStorageSpy.getItem.and.returnValue(JSON.stringify(storedFavorites));
    service = TestBed.inject(FavoritesService);
    
    service.favorites$.subscribe(favorites => {
      expect(favorites).toEqual(storedFavorites);
    });
  });

  it('should add a trial to favorites', () => {
    service.addToFavorites(mockTrial);
    
    service.favorites$.subscribe(favorites => {
      expect(favorites).toContain(jasmine.objectContaining({
        nctId: mockTrial.nctId,
        isFavorite: true
      }));
    });
  });

  it('should not add duplicate trials to favorites', () => {
    service.addToFavorites(mockTrial);
    service.addToFavorites(mockTrial);
    
    service.favorites$.subscribe(favorites => {
      expect(favorites.length).toBe(1);
    });
  });

  it('should throw error when adding beyond max favorites limit', () => {
    const maxFavorites = Array(10).fill({ ...mockTrial });
    localStorageSpy.getItem.and.returnValue(JSON.stringify(maxFavorites));
    service = TestBed.inject(FavoritesService);

    expect(() => service.addToFavorites(mockTrial))
      .toThrowError('Maximum number of favorites (10) reached');
  });

  it('should remove a trial from favorites', () => {
    service.addToFavorites(mockTrial);
    service.removeFromFavorites(mockTrial.nctId);
    
    service.favorites$.subscribe(favorites => {
      expect(favorites).not.toContain(jasmine.objectContaining({
        nctId: mockTrial.nctId
      }));
    });
  });

  it('should check if a trial is favorite', () => {
    service.addToFavorites(mockTrial);
    expect(service.isFavorite(mockTrial.nctId)).toBeTrue();
    
    service.removeFromFavorites(mockTrial.nctId);
    expect(service.isFavorite(mockTrial.nctId)).toBeFalse();
  });

  it('should get favorites count', () => {
    expect(service.getFavoritesCount()).toBe(0);
    
    service.addToFavorites(mockTrial);
    expect(service.getFavoritesCount()).toBe(1);
  });

  it('should clear all favorites', () => {
    service.addToFavorites(mockTrial);
    service.clearFavorites();
    
    service.favorites$.subscribe(favorites => {
      expect(favorites).toEqual([]);
    });
    expect(localStorageSpy.removeItem).toHaveBeenCalled();
  });

  it('should handle localStorage errors when saving', () => {
    localStorageSpy.setItem.and.throwError('Storage error');
    
    expect(() => service.addToFavorites(mockTrial))
      .toThrowError('Failed to save favorites');
  });

  it('should handle localStorage errors when clearing', () => {
    localStorageSpy.removeItem.and.throwError('Storage error');
    
    expect(() => service.clearFavorites())
      .toThrowError('Failed to clear favorites');
  });
});
