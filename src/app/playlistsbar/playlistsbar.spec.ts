import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Playlistsbar } from './playlistsbar';

describe('Playlistsbar', () => {
  let component: Playlistsbar;
  let fixture: ComponentFixture<Playlistsbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Playlistsbar],
    }).compileComponents();

    fixture = TestBed.createComponent(Playlistsbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
