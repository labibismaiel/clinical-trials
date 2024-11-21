import { TestBed } from '@angular/core/testing';

import { ClinicalTrialsService } from './clinical-trials.service';

describe('ClinicalTrialsService', () => {
  let service: ClinicalTrialsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClinicalTrialsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
