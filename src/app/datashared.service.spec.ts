import { TestBed } from '@angular/core/testing';

import { DatasharedService } from './datashared.service';

describe('DatasharedService', () => {
  let service: DatasharedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DatasharedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
