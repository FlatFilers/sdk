/* eslint-disable @typescript-eslint/no-explicit-any */
import 'highlight.js/styles/ocean.css'

import { useCallback, useRef, useState } from 'react'
import { Button, Columns, Container, Form } from 'react-bulma-components'
import Highlight from 'react-highlight'
import styled from 'styled-components'

import { Flatfile, PartialRejection, RecordError } from '../src'
import { serializeFunction } from '../src'
import { FlatfileError } from '../src/errors/FlatfileError'
import { BrowserFrame } from './BrowserFrame'

export function Sandbox(): any {
  const importerRef = useRef<any>()

  const [output, setOutput] = useState<Record<string, any>[]>()
  const [workspaceId, setWorkspaceId] = useState<string>('')
  const [batchId, setBatchId] = useState<string>('')
  const [error, setError] = useState<FlatfileError>()
  const [useWindow, setUseWindow] = useState<boolean>(false)

  const [embedId, setEmbedId] = useState(localStorage.getItem('embed_id') || '')
  const [endUserEmail, setEndUserEmail] = useState(localStorage.getItem('end_user_email') || '')
  const [privateKey, setPrivateKey] = useState(localStorage.getItem('private_key') || '')
  const [mountUrl, setMountUrl] = useState(localStorage.getItem('mount_url') || '')
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('api_url') || '')
  const [frameUrl, setFrameUrl] = useState<string>()

  const handleInit = useCallback(async () => {
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
    const flatfile = new Flatfile({
      token,
      mountUrl,
      apiUrl,
    })

    flatfile.on('error', ({ error }) => {
      setError(error)
    })

    const HOOK_HELPER = serializeFunction(function (a: number, b: number) {
      return a * b * 4
    })

    const session = await flatfile.startOrResumeImportSession({
      onInit: ({ meta, session }) => {
        const { workspaceId, batchId } = meta
        setWorkspaceId(workspaceId)
        setBatchId(batchId)
        session.updateEnvironment({
          HOOK_HELPER,
        })
        if (useWindow) {
          session.openInNewWindow({
            customFields: [
              {
                field: 'test',
                type: 'string',
                label: 'Real Tests',
              },
              {
                field: 'foos',
                type: 'string',
                label: 'Fax Bars',
              },
            ],
          })
        } else {
          setFrameUrl(
            session.signedImportUrl({
              theme: {
                loadingText: 'Custom loading text ...',
                submitCompleteText: 'Custom submit text ...',
                displayName: 'Company Name',
              },
            })
          )
        }
      },
      onData: (chunk, next) => {
        console.log(
          `CHUNK ${chunk.currentChunkIndex}`,
          chunk.records.map((r) => r.data)
        )
        setOutput((prevOutput) => {
          const prevData = prevOutput || []
          const newData = chunk.records.map((r) => r.data)
          return [...newData, ...prevData]
        })

        next(
          // A PartialRejection could be created with a list or a single RecordError.
          new PartialRejection(
            new RecordError(chunk.records[0].recordId, [
              { field: 'name', message: 'This person already exists.' },
            ])
          )
        )
      },
    })

    // can be triggered n times
    session.on('submit', async () => {
      console.log('done')
      // todo: handling of submit progress
    })

    const batchId = session.batchId

    console.log(`${batchId} has been launched.`)

    importerRef.current = session
  }, [output, embedId, endUserEmail, privateKey, mountUrl, apiUrl, useWindow])

  return (
    <div style={{ padding: '45px 13px' }}>
      <Container breakpoint='fluid'>
        <Columns>
          {!output && (
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
                  {' '}
                  {importerRef.current && <Button color={'danger'} onClick={() => importerRef.current.close()}>
                    Close
                  </Button>}
                  <Form.Checkbox
                    style={{ color: '#fff', margin: '10px 0 0 20px' }}
                    onChange={(e) => {
                      setUseWindow(e.target.checked)
                    }}
                    checked={useWindow}
                  >
                    Open in New Window
                  </Form.Checkbox>
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
          )}
          <Columns.Column style={{ position: 'relative' }}>
            <BrowserFrame url={frameUrl} />
            {error ? (
              <div style={{ position: 'absolute', left: '20px', bottom: '20px', right: '20px' }}>
                <div className='notification is-danger'>
                  <button
                    className='delete'
                    onClick={() => {
                      setError(undefined)
                    }}
                  />
                  <h5 className='is-size-5 has-text-weight-medium mb-1'>
                    <code>{error.code}</code> {error.name}
                  </h5>
                  <div className='mb-1'>{error.userMessage}</div>
                  <div className='is-family-monospace is-size-7'>
                    <code>DEBUG</code> {error.debug}
                  </div>
                </div>
              </div>
            ) : (
              <></>
            )}
          </Columns.Column>

          {output && (
            <Columns.Column size='one-quarter' style={{ paddingRight: '2rem' }}>
              <CodeWrapper>
                <Highlight className='language-json'>{JSON.stringify(output, null, 4)}</Highlight>
              </CodeWrapper>
            </Columns.Column>
          )}
        </Columns>
      </Container>
    </div>
  )
}

const CodeWrapper = styled.div`
  border-radius: 10px;
  overflow: auto;
  height: calc(100vh - 100px);
  background-color: #2b303b;
  position: relative;

  pre {
    font-size: 0.75rem;
    line-height: 1.2;
  }
  > pre {
    padding: 0;
  }
`
