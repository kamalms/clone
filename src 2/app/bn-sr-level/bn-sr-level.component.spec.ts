import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BnSRLevelComponent } from './bn-sr-level.component';

describe('BnSRLevelComponent', () => {
  let component: BnSRLevelComponent;
  let fixture: ComponentFixture<BnSRLevelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BnSRLevelComponent]
    });
    fixture = TestBed.createComponent(BnSRLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
