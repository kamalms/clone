import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackTestDetailComponent } from './back-test-detail.component';

describe('BackTestDetailComponent', () => {
  let component: BackTestDetailComponent;
  let fixture: ComponentFixture<BackTestDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BackTestDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackTestDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
