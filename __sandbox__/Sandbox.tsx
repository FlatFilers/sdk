import { useRef, useState } from 'react'
import styled from 'styled-components'

import { flatfileImporter } from '../src'
import { sign } from './utils/jwt'

const InputGroup = styled.div`
  margin-top: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  max-width: 46%;
  outline: none;
`

const Log = styled.div`
  margin-top: 3rem;
  background-color: #404551;
  padding: 1rem;
  background-color: #404551;
  min-height: 300px;
  border-radius: 0.25rem;
`

const Wrapper = styled.main`
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
  background-color: #794cff;
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 0.25rem;
  border: none;
  outline: none;
  box-shadow: none;
  font-size: 1rem;
  font-weight: bold;

  &:hover {
    background-color: #8c66ff;
    cursor: pointer;
  }
`

const FileButton = styled.label`
  background-color: #794cff;
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 0.25rem;
  border: none;
  outline: none;
  box-shadow: none;
  font-size: 1rem;
  font-weight: bold;

  &:hover {
    background-color: #8c66ff;
    cursor: pointer;
  }

  input[type='file'] {
    width: 0;
    height: 0;
  }
`

export function Sandbox(): any {
  const importerRef = useRef<any>()

  const [canClose, setCanClose] = useState(false)

  const [embedId, setEmbedId] = useState(localStorage.getItem('embed_id') || '')
  const [endUserEmail, setEndUserEmail] = useState(localStorage.getItem('end_user_email') || '')

  const [log, setLog] = useState<{ event: string; payload: any }[]>([])

  const handleAddLog = (event: string, payload: any) => {
    setLog((l) => [
      ...l,
      {
        event,
        payload,
      },
    ])
  }

  const handleInit = async (file?: File, configs = {}) => {
    if (!embedId || !endUserEmail) {
      return alert('Embed ID and End User Email are required.')
    }

    localStorage.setItem('embed_id', embedId)
    localStorage.setItem('end_user_email', endUserEmail)

    const token = await sign(
      {
        embed: embedId,
        sub: endUserEmail,
      },
      'qweqwe'
    )

    const importer = flatfileImporter(token).launch({
      file,
      ...configs,
    })

    importer.on('init', (payload: any) => handleAddLog('init', payload))
    importer.on('upload', (payload: any) => handleAddLog('upload', payload))
    importer.on('error', (payload: any) => handleAddLog('error', payload))
    importer.on('launch', (payload: any) => {
      handleAddLog('launch', payload)
      setCanClose(true)
    })
    importer.on('close', (payload: any) => {
      handleAddLog('close', payload)
      setCanClose(false)
    })

    importerRef.current = importer
  }

  return (
    <Wrapper>
      <Container>
        <InputGroup>
          <Input
            placeholder='Embed ID'
            value={embedId}
            onChange={(e) => setEmbedId(e.target.value)}
          />
          <Input
            placeholder='End User Email'
            value={endUserEmail}
            onChange={(e) => setEndUserEmail(e.target.value)}
          />
        </InputGroup>

        <ButtonGroup>
          <Button onClick={() => handleInit()}>Launch</Button>
          <Button onClick={() => handleInit(undefined, { newTab: true })}>Launch new tab</Button>
          <FileButton htmlFor='file'>
            Launch with File
            <input
              accept='.csv'
              type='file'
              id='file'
              onChange={(e) => (e.target.files ? handleInit(e.target.files[0]) : {})}
            />
          </FileButton>

          {canClose && (
            <Button
              onClick={() => {
                ;(importerRef.current as any).close()
              }}
            >
              Close Importer
            </Button>
          )}
        </ButtonGroup>

        <Log>
          {log.length ? (
            log.map((l, i) => (
              <p key={i}>
                {new Date().toLocaleString()} - {l.event} - {JSON.stringify(l.payload)}
              </p>
            ))
          ) : (
            <p className='placeholder'>Logs will appear here...</p>
          )}
        </Log>
      </Container>
    </Wrapper>
  )
}
