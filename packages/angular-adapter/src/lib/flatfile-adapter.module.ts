import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'

import { FlatfileButtonComponent } from './flatfile-button.component'

@NgModule({
  declarations: [FlatfileButtonComponent],
  imports: [CommonModule],
  exports: [FlatfileButtonComponent],
})
export class FlatfileAdapterModule {}
