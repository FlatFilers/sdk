import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core'
import { flatfileImporter, IEvents, IFlatfileImporter } from '@flatfile/sdk'

@Component({
  selector: 'flatfile-button',
  template: `
    <button (click)="launch()" [disabled]="!isImporterLoaded">
      <div #ref [class.hide]="!isImporterLoaded">
        <ng-content></ng-content>
      </div>
      <!-- <span *ngIf="!ref && !ref.innerHTML.trim() && isImporterLoaded">🔼 Upload with Flatfile</span> -->
      <!-- <span *ngIf="!ref && !ref.innerHTML.trim() && isImporterLoaded">🔼 Upload with Flatfile</span> -->
      <span *ngIf="!isImporterLoaded"> 🅧 Failed to Load Flatfile Importer </span>
    </button>
  `,
  styles: [
    `
      .hide {
        display: none;
      }
    `,
  ],
})
export class FlatfileButtonComponent implements OnInit, OnDestroy {
  @Input() token = ''
  @Input() mountUrl?: string
  @Input() apiUrl?: string
  @Output() onInit = new EventEmitter<IEvents['init']>()
  @Output() onUpload = new EventEmitter<IEvents['upload']>()
  @Output() onLaunch = new EventEmitter<IEvents['launch']>()
  @Output() onClose = new EventEmitter<IEvents['close']>()
  @Output() onComplete = new EventEmitter<IEvents['complete']>()
  @Output() onError = new EventEmitter<IEvents['error']>()

  @ViewChild('ref', { read: ElementRef, static: true }) ref?: ElementRef

  isImporterLoaded = true

  private flatfileImporter: IFlatfileImporter | undefined

  public ngOnInit(): void {
    if (!this.token) {
      console.error('📥 Flatfile Importer ERROR - "token" missing via @Input()')
      this.isImporterLoaded = false
      return
    }

    if (typeof flatfileImporter === 'undefined') {
      console.log('📥 Flatfile Importer ERROR - importer failed to load')
      this.isImporterLoaded = false
      return
    }

    this.flatfileImporter = flatfileImporter(this.token, {
      ...(this.mountUrl ? { mountUrl: this.mountUrl } : {}),
      ...(this.apiUrl ? { apiUrl: this.apiUrl } : {}),
    })

    this.flatfileImporter.on('init', (res) => this.onInit.next(res))
    this.flatfileImporter.on('upload', (res) => this.onUpload.next(res))
    this.flatfileImporter.on('launch', (res) => this.onLaunch.next(res))
    this.flatfileImporter.on('close', (res) => this.onClose.next(res))
    this.flatfileImporter.on('complete', (res) => this.onComplete.next(res))
  }

  public ngOnDestroy(): void {
    this.flatfileImporter?.close()
  }

  public launch(): void {
    this.flatfileImporter?.launch().catch((e: Error) => {
      this.onError.next({ error: e })
    })
  }
}
