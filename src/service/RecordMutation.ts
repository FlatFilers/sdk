import { ELevel, FlatfileRecord, IRecordInfo, TPrimitive } from './FlatfileRecord'

export class RecordMutation {
  private $edits: Record<string, TPrimitive> = {}
  private $info: IRecordInfo[] = []

  /**
   * Reference to the Flatfile internal ID of the record in the sheet
   */
  public readonly recordId: number

  constructor(recordOrId: FlatfileRecord | number) {
    if (recordOrId instanceof FlatfileRecord) {
      this.recordId = recordOrId.recordId
    } else {
      this.recordId = recordOrId
    }
  }

  /**
   * Modify the value of a field
   *
   * @param field
   * @param value
   */
  public set(field: string, value: TPrimitive): this {
    this.$edits[field] = value
    return this
  }

  /**
   * Add an info message to the mutation
   *
   * @param fields
   * @param message
   */
  public addInfo(fields: string | string[], message: string): this {
    return this.addMessage(fields, message, ELevel.INFO)
  }

  /**
   * Add an info message to the mutation
   *
   * @alias addInfo
   * @param fields
   * @param message
   */
  public addComment(fields: string | string[], message: string): this {
    return this.addInfo(fields, message)
  }

  /**
   * Add an error message to the mutation
   *
   * @param fields
   * @param message
   */
  public addError(fields: string | string[], message: string): this {
    return this.addMessage(fields, message, ELevel.ERROR)
  }

  /**
   * Add a warning message
   *
   * @param fields
   * @param message
   */
  public addWarning(fields: string | string[], message: string): this {
    return this.addMessage(fields, message, ELevel.WARN)
  }

  /**
   * Add any type of message to one or more fields.
   *
   * @param fields
   * @param message
   * @param level
   */
  public addMessage(fields: string | string[], message: string, level: IRecordInfo['level']): this {
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

  /**
   * Return the payload needed for the GraphQL endpoint
   * @note yes, this endpoint does indeed use entirely different structure for both messages and ids than others
   */
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
}
