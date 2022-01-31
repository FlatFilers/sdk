import { ApiService } from '../api'
import { IRowResponse } from '../queries/GET_FINAL_DATABASE_VIEW'

export class FlatfileRecord {
  public readonly data: TRecordData
  public readonly id: number
  private $info: IRecordInfo[] = []

  constructor(private api: ApiService, private $raw: IRowResponse) {
    this.data = $raw.data
    this.id = $raw.id
  }

  public get valid(): boolean {
    return this.$raw.valid
  }

  public get status(): ERecordStatus {
    return this.$raw.status
  }

  public get allMessages(): IRecordInfo[] {
    return this.$raw.info
  }

  public get errors(): IRecordInfo[] {
    return this.$raw.info.filter((m) => m.level === ELevel.ERROR)
  }

  public get warnings(): IRecordInfo[] {
    return this.$raw.info.filter((m) => m.level === ELevel.WARN)
  }

  public get info(): IRecordInfo[] {
    return this.$raw.info.filter((m) => m.level === ELevel.INFO)
  }

  public set(field: string, value: TPrimitive) {
    if (!this.verifyField(field)) {
      return this
    }

    Object.defineProperty(this.data, field, {
      value,
    })

    return this
  }

  public addInfo(fields: string | string[], message: string): this {
    return this.pushMessage(fields, message, ELevel.INFO)
  }

  public addError(fields: string | string[], message: string): this {
    return this.pushMessage(fields, message, ELevel.ERROR)
  }

  public addWarning(fields: string | string[], message: string): this {
    return this.pushMessage(fields, message, ELevel.WARN)
  }

  private pushMessage(
    fields: string | string[],
    message: string,
    level: IRecordInfo['level']
  ): this {
    fields = Array.isArray(fields) ? fields : [fields]

    fields.forEach((key) => {
      if (this.verifyField(key)) {
        this.$info.push({
          key,
          message,
          level,
        })
      }
    })
    return this
  }

  private verifyField(field: string): boolean {
    if (!this.data.hasOwnProperty(field)) {
      // TODO: make sure user's aware of this message
      console.error(`Record does not have field "${field}".`)
      return false
    }
    return true
  }
}

export type TPrimitive = string | boolean | number | null

export type TRecordData<T extends TPrimitive | undefined = TPrimitive> = { [key: string]: T }

export enum ELevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
}
export interface IRecordInfo<L extends ELevel = ELevel> {
  level: L
  key: string
  message: string
}
export enum ERecordStatus {
  REVIEW = 'review',
  DISMISSED = 'dismissed',
  ACCEPTED = 'accepted',
}
