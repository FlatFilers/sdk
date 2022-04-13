import { ComponentFixture, TestBed } from '@angular/core/testing'

import { FlatfileButtonComponent } from './flatfile-button.component'

describe('FlatfileButtonComponent', () => {
  let component: FlatfileButtonComponent
  let fixture: ComponentFixture<FlatfileButtonComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FlatfileButtonComponent],
    }).compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(FlatfileButtonComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
