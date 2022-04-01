import { ImportSession } from '../importer/ImportSession'

export abstract class ClientResponse {
  public abstract executeResponse(session: ImportSession): Promise<this>
}
