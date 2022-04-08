import nock from 'nock'

import { RequestError } from '../errors/RequestError'
import { UnauthorizedError } from '../errors/UnauthorizedError'
import { Flatfile } from '../Flatfile'
import { ImportSession } from '../importer/ImportSession'
import { mockGraphQLRequest } from '../lib/test-helper'
import { ERecordStatus } from '../service/FlatfileRecord'
import { ApiService } from './ApiService'

describe('ApiService', () => {
  let session: ImportSession
  let api: ApiService
  let flatfile: Flatfile

  beforeEach(async () => {
    api = new ApiService('token', 'http://localhost')
    flatfile = new Flatfile('token', { apiUrl: 'http://localhost:3000' })
    flatfile.api = api
    session = new ImportSession(flatfile, {
      batchId: 'abc',
      workspaceId: 'def',
      workbookId: 'hij',
      schemaIds: ['99'],
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    nock.cleanAll()
  })

  describe('initEmptyBatch', () => {
    const req = () => api.initEmptyBatch()
    test('resolves successfully', async () => {
      const payload = {
        batchId: 'a0ccc473-9612-43d4-97aa-3491f35d73ca',
        schemas: [{ id: '062d8e0e-d4b8-4db9-bbdc-8364741e4924' }],
        workspaceId: '422f8c35-66f9-4b9e-8ab1-e7dfda4b90d1',
      }
      mockGraphQLRequest('initializeEmptyBatch', 200, payload)
      await expect(req()).resolves.toEqual(payload)
    })
    test('handles errors', async () => {
      mockError()
      await expect(req()).rejects.toThrow(RequestError)
    })
  })

  describe('init', () => {
    test('resolves successfully with refactored schemaIds', async () => {
      const payload = {
        batchId: 'a0ccc473-9612-43d4-97aa-3491f35d73ca',
        schemas: [{ id: '062d8e0e-d4b8-4db9-bbdc-8364741e4924' }],
        workspaceId: '422f8c35-66f9-4b9e-8ab1-e7dfda4b90d1',
      }
      mockGraphQLRequest('initializeEmptyBatch', 200, payload)
      await expect(api.init()).resolves.toEqual({
        batchId: 'a0ccc473-9612-43d4-97aa-3491f35d73ca',
        schemaIds: ['062d8e0e-d4b8-4db9-bbdc-8364741e4924'],
        workspaceId: '422f8c35-66f9-4b9e-8ab1-e7dfda4b90d1',
      })
    })
  })

  describe('getWorkbookId', () => {
    const req = () => api.getWorkbookId('d7f5e4d2-24d8-4e76-bfbb-bcc4eeb6c881')
    test('resolves successfully', async () => {
      const payload = {
        workbookId: '422f8c35-66f9-4b9e-8ab1-e7dfda4b90d1',
      }
      mockGraphQLRequest('preflightBatch', 200, payload)
      await expect(req()).resolves.toEqual('422f8c35-66f9-4b9e-8ab1-e7dfda4b90d1')
    })
    test('handles errors', async () => {
      mockError()
      await expect(req()).rejects.toThrow(RequestError)
    })
  })

  describe('getAllRecords', () => {
    describe('single page', () => {
      const req = () => api.getAllRecords('d7f5e4d2-24d8-4e76-bfbb-bcc4eeb6c881')

      test('resolves successfully', async () => {
        const payload = { rows: [], totalRows: 10 }
        mockGraphQLRequest('getFinalDatabaseView', 200, payload)
        await expect(req()).resolves.toEqual(payload)
      })

      test('handles errors', async () => {
        mockError()
        await expect(req()).rejects.toThrow(RequestError)
      })
    })

    test('paginates as necessary', async () => {
      const payload = {
        rows: [1, 2, 3, 4, 5].map((id) => ({ ...defaultRow, id })),
        totalRows: 10,
      }
      const spy = mockGraphQLRequest('getFinalDatabaseView', 200, payload, 2)
      const res = await api.getAllRecords('d7f5e4d2-24d8-4e76-bfbb-bcc4eeb6c881', 0, false, 5)

      expect(res.rows.length).toBe(10)
      expect(spy.isDone())
    })
  })

  describe('getRecordsByStatus', () => {
    const req = () => api.getRecordsByStatus(session, ERecordStatus.REVIEW)

    test('resolves successfully', async () => {
      const payload = {
        rows: [1, 2, 3, 4, 5].map((id) => ({ ...defaultRow, id })),
        totalRows: 10,
      }
      mockGraphQLRequest('getFinalDatabaseView', 200, payload)
      const res = await req()
      await expect(res.recordIds).toEqual([1, 2, 3, 4, 5])
    })

    test('handles errors', async () => {
      mockError()
      await expect(req()).rejects.toThrow(RequestError)
    })
  })

  describe('updateRecordStatus', () => {
    const req = () => api.updateRecordStatus(session, [1, 2, 3, 4, 5], ERecordStatus.REVIEW)

    test('resolves successfully', async () => {
      const payload = { id: 'd1422070-24ba-4a7f-92ea-687c9bc28f58' }
      mockGraphQLRequest('queueUpdateRecordStatus', 200, payload)
      await expect(req()).resolves.toEqual(payload)
    })

    test('handles errors', async () => {
      mockError()
      await expect(req()).rejects.toThrow(RequestError)
    })
  })

  describe('updateSessionEnv', () => {
    const req = () => api.updateSessionEnv(session, { foo: 'bar' })

    test('resolves successfully', async () => {
      const payload = { success: true }
      mockGraphQLRequest('updateWorkspaceEnvironment', 200, payload)
      await expect(req()).resolves.toEqual(payload)
    })

    test('handles errors', async () => {
      mockError()
      await expect(req()).rejects.toThrow(RequestError)
    })
  })

  describe('handleGraphQLErrors', () => {
    test('handles unauthorized specifically', async () => {
      const payload = { errors: true }
      mockGraphQLRequest('updateWorkspaceEnvironment', 200, payload)
      await expect(() => api.handleGraphQLErrors([{ message: 'Unauthorized' }])).toThrow(
        UnauthorizedError
      )
    })
    test('handles generic error', async () => {
      const payload = { errors: true }
      mockGraphQLRequest('updateWorkspaceEnvironment', 200, payload)
      await expect(() => api.handleGraphQLErrors([], 'Something is awry.')).toThrowError(
        'Something is awry.'
      )
    })
    test('handles no error payload', async () => {
      const payload = { errors: true }
      mockGraphQLRequest('updateWorkspaceEnvironment', 200, payload)
      await expect(() => api.handleGraphQLErrors([])).toThrowError('Something went wrong')
    })
  })

  describe('subscribeBatchStatusUpdated', () => {
    test.todo('connects successfully and receives events')
  })
})

const defaultRow = { id: 1, valid: true, status: ERecordStatus.REVIEW, data: {}, info: [] }

const mockError = () => {
  mockGraphQLRequest('notrelevant', 500, {
    errors: [{ message: 'life is sad' }],
  })
  return RequestError
}
