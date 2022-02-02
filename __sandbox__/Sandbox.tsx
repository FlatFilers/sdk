/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useRef, useState } from 'react'
import styled from 'styled-components'

import { Flatfile } from '../src'
import { RecordError } from '../src/graphql/service/RecordError'
import { PartialRejection } from '../src/graphql/service/PartialRejection'

const Output = styled.textarea`
  width: 100%;
  margin-top: 3rem;
  background-color: #404551;
  padding: 1rem;
  min-height: 300px;
  border-radius: 0.25rem;
  max-height: 300px;
  color: white;
`

const InputGroup = styled.div`
  margin-top: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;

  & > * {
    width: 100%;
    max-width: 32.5%;

    label {
      display: block;
      margin-bottom: 0.5rem;
    }
  }
`

const Input = styled.input`
  background-color: #404551;
  width: 100%;
  flex: 1;
  border: none;
  border-radius: 0.25rem;
  color: white;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  outline: none;
`

const Wrapper = styled.main`
  background-color: #2f333d;
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
`

const Container = styled.div`
  max-width: 1024px;
  overflow-y: auto;
  width: 100%;
  margin: auto;

  p {
    margin: 0;
    font-size: 1rem;

    &.placeholder {
      text-align: center;
      opacity: 0.35;
    }
  }
`

const ButtonGroup = styled.div`
  margin-top: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;

  & > * {
    margin-right: 2rem;

    &:last-child {
      margin-right: 0;
    }
  }
`

const Button = styled.button`
  background-color: #3b2fc9;
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 0.25rem;
  border: none;
  outline: none;
  box-shadow: none;
  font-size: 1rem;
  font-weight: bold;

  &:hover {
    background-color: #002e70;
    cursor: pointer;
  }
`

export function Sandbox(): any {
  const importerRef = useRef<any>()

  const [output, setOutput] = useState<string>('')

  const [embedId, setEmbedId] = useState(localStorage.getItem('embed_id') || '')
  const [endUserEmail, setEndUserEmail] = useState(localStorage.getItem('end_user_email') || '')
  const [privateKey, setPrivateKey] = useState(localStorage.getItem('private_key') || '')
  const [mountUrl, setMountUrl] = useState(localStorage.getItem('mount_url') || '')
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('api_url') || '')

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

      session.on('error', (error) => {
        console.error(error)
      })

      // can be triggered n times
      session.on('submit', async () => {
        // display my on processing dialog
        await session.processPendingRecords(
          (chunk, next) => {
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
        // todo: handling of submit progress
      })

      const batchId = session.batchId

      newWindow ? await session.openInNewWindow() : await session.openInEmbeddedIframe()

      console.log(`${batchId} has been launched.`)

      importerRef.current = session
    },
    [output]
  )

  return (
    <Wrapper>
      <Container>
        <InputGroup>
          <div>
            <label>Embed ID</label>
            <Input
              placeholder='Enter embed ID'
              value={embedId}
              onChange={(e) => setEmbedId(e.target.value)}
            />
          </div>
          <div>
            <label>User Email</label>
            <Input
              placeholder='Enter user email'
              value={endUserEmail}
              onChange={(e) => setEndUserEmail(e.target.value)}
            />
          </div>
          <div>
            <label>Private key</label>
            <Input
              type='password'
              placeholder='Enter private key'
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
            />
          </div>
        </InputGroup>
        <InputGroup>
          <div>
            <label>Mount Url</label>
            <Input
              placeholder='e.g. https://app.flatfile.io'
              value={mountUrl}
              onChange={(e) => setMountUrl(e.target.value)}
            />
          </div>
          <div>
            <label>API Url</label>
            <Input
              placeholder='e.g. https://api.us.flatfile.io'
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
            />
          </div>
        </InputGroup>

        <ButtonGroup>
          <Button onClick={() => handleInit()}>Launch as PopUp</Button>
          <Button onClick={() => handleInit(true)}>Launch as New Tab</Button>
        </ButtonGroup>

        <Output readOnly placeholder='Data will appear here...' value={output} />
      </Container>
    </Wrapper>
  )
}
