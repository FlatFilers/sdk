import { ELevel, FlatfileRecord, IRecordInfo, TPrimitive } from './FlatfileRecord'

export class RecordMutation {
  private $edits: Record<string, TPrimitive> = {}
  private $info: IRecordInfo[] = []

  public readonly recordId: number
  constructor(recordOrId: FlatfileRecord | number) {
    if (recordOrId instanceof FlatfileRecord) {
      this.recordId = recordOrId.recordId
    } else {
      this.recordId = recordOrId
    }
  }

  public set(field: string, value: TPrimitive): this {
    this.$edits[field] = value
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

  public toGraphQLEdits(): {
    _id: number
    data: Record<string, TPrimitive>
    messages: Record<string, string>[]
  } {
    return {
      _id: this.recordId,
      data: this.$edits,
      messages: this.$info.map((i) => ({ error: i.level, key: i.key, message: i.message })),
    }
  }

  private pushMessage(
    fields: string | string[],
    message: string,
    level: IRecordInfo['level']
  ): this {
    fields = Array.isArray(fields) ? fields : [fields]

    fields.forEach((key) => {
      this.$info.push({
        key,
        message,
        level,
      })
    })
    return this
  }
}
