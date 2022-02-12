/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useRef, useState } from 'react'
import { Button, Columns, Container, Form } from 'react-bulma-components'

import { Flatfile, PartialRejection, RecordError } from '../src'
import { serializeFunction } from '../src'
import { BrowserFrame } from './BrowserFrame'

export function Sandbox(): any {
  const importerRef = useRef<any>()

  const [output, setOutput] = useState<string>('')
  const [workspaceId, setWorkspaceId] = useState<string>('')
  const [batchId, setBatchId] = useState<string>('')

  const [embedId, setEmbedId] = useState(localStorage.getItem('embed_id') || '')
  const [endUserEmail, setEndUserEmail] = useState(localStorage.getItem('end_user_email') || '')
  const [privateKey, setPrivateKey] = useState(localStorage.getItem('private_key') || '')
  const [mountUrl, setMountUrl] = useState(localStorage.getItem('mount_url') || '')
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('api_url') || '')
  const [frameUrl, setFrameUrl] = useState<string>()

  const handleInit = useCallback(
    async (newWindow = false) => {
      localStorage.setItem('embed_id', embedId)
      localStorage.setItem('end_user_email', endUserEmail)
      localStorage.setItem('private_key', privateKey)
      localStorage.setItem('mount_url', mountUrl)
      localStorage.setItem('api_url', apiUrl)

      if (!embedId || !endUserEmail || !privateKey) {
        return alert('Embed id, user email & private key are required fields.')
      }
      const token = await Flatfile.getDevelopmentToken(
        embedId,
        {
          user: {
            id: 99,
            email: endUserEmail,
            name: 'John Doe',
          },
        },
        privateKey
      )
      // TOKEN has to be generated per user session on the server-side
      const flatfile = new Flatfile(token, {
        mountUrl,
        apiUrl,
      })

      const session = await flatfile.startOrResumeImportSession()
      setWorkspaceId(session.meta.workspaceId)
      setBatchId(session.batchId)
      const HOOK_HELPER = serializeFunction(function (a: number, b: number) {
        return a * b * 4
      })
      await session.updateEnvironment({
        HOOK_HELPER,
      })

      setFrameUrl(session.signedImportUrl)

      session.on('error', (error) => {
        console.error(error)
      })

      // can be triggered n times
      session.on('submit', async () => {
        // display my on processing dialog
        await session.processPendingRecords(
          (chunk, next) => {
            console.log(
              `CHUNK ${chunk.currentChunkIndex}`,
              chunk.records.map((r) => r.data)
            )
            setOutput(
              output +
                `\n\n CHUNK ${chunk.currentChunkIndex} ------\n` +
                JSON.stringify(
                  chunk.records.map((r) => r.data),
                  null,
                  4
                )
            )

            next(
              new PartialRejection(
                new RecordError(1, [{ field: 'full_name', message: 'This person already exists.' }])
              )
            )
          },
          { chunkSize: 10 }
        )
        console.log('done')
        // todo: handling of submit progress
      })

      const batchId = session.batchId

      if (newWindow) {
        session.openInNewWindow()
      } else {
        // session.openInEmbeddedIframe()
      }

      console.log(`${batchId} has been launched.`)

      importerRef.current = session
    },
    [output, embedId, endUserEmail, privateKey, mountUrl, apiUrl]
  )
  return (
    <div style={{ padding: '45px 13px' }}>
      <Container breakpoint='fluid'>
        <Columns>
          <Columns.Column size='one-quarter' style={{ paddingRight: '2rem' }}>
            <h1 className='title has-text-light'>Flatfile SDK</h1>
            <p className='subtitle has-text-light'>Quickly configure and test the Flatfile SDK</p>
            <Form.Field>
              <Form.Label className='has-text-light'>Embed ID</Form.Label>
              <Form.Input
                placeholder='Enter embed ID'
                value={embedId}
                onChange={(e) => setEmbedId(e.target.value)}
              />
            </Form.Field>
            <Form.Field>
              <Form.Label className='has-text-light'>User Email</Form.Label>
              <Form.Input
                placeholder='Enter user email'
                value={endUserEmail}
                onChange={(e) => setEndUserEmail(e.target.value)}
              />
            </Form.Field>
            <Form.Field>
              <Form.Label className='has-text-light'>Private key</Form.Label>
              <Form.Input
                type='password'
                placeholder='Enter private key'
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
              />
            </Form.Field>
            <Form.Field>
              <Form.Label className='has-text-light'>Mount Url</Form.Label>
              <Form.Input
                placeholder='e.g. https://app.flatfile.io'
                value={mountUrl}
                onChange={(e) => setMountUrl(e.target.value)}
              />
            </Form.Field>
            <Form.Field>
              <Form.Label className='has-text-light'>API Url</Form.Label>
              <Form.Input
                placeholder='e.g. https://api.us.flatfile.io'
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
              />
            </Form.Field>
            <Form.Field style={{ marginTop: '30px' }}>
              <Form.Control>
                <Button color={'primary'} onClick={() => handleInit()}>
                  Start
                </Button>
              </Form.Control>
            </Form.Field>
            <hr />
            <Form.Field>
              <Form.Label className='has-text-light'>Workspace ID</Form.Label>
              <Form.Input placeholder='... after start' value={workspaceId} readOnly={true} />
            </Form.Field>
            <Form.Field>
              <Form.Label className='has-text-light'>Batch ID</Form.Label>
              <Form.Input placeholder='... after start' value={batchId} readOnly={true} />
            </Form.Field>
          </Columns.Column>
          <Columns.Column>
            <BrowserFrame url={frameUrl} />
          </Columns.Column>
        </Columns>
      </Container>
    </div>
  )
}
