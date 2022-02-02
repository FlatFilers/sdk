import { IRowResponse } from '../queries/GET_FINAL_DATABASE_VIEW'
import { RecordMutation } from './RecordMutation'

export class FlatfileRecord {
  public readonly data: TRecordData
  public readonly recordId: number
  private readonly $info: IRecordMessage[]

  constructor(private $raw: IRowResponse) {
    this.data = $raw.data
    this.recordId = $raw.id
    this.$info = this.$raw.info.map((i) => ({ level: i.level, field: i.key, message: i.message }))
  }

  public get valid(): boolean {
    return this.$raw.valid
  }

  public get status(): ERecordStatus {
    return this.$raw.status
  }

  public get allMessages(): IRecordMessage[] {
    return this.$info
  }

  public get errors(): IRecordMessage[] {
    return this.$info.filter((m) => m.level === ELevel.ERROR)
  }

  public get warnings(): IRecordMessage[] {
    return this.$info.filter((m) => m.level === ELevel.WARN)
  }

  public get info(): IRecordMessage[] {
    return this.$info.filter((m) => m.level === ELevel.INFO)
  }

  public getMutation(): RecordMutation {
    return new RecordMutation(this)
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

export interface IRecordMessage<L extends ELevel = ELevel> {
  level: L
  field: string
  message: string
}
export enum ERecordStatus {
  REVIEW = 'review',
  DISMISSED = 'dismissed',
  ACCEPTED = 'accepted',
}
