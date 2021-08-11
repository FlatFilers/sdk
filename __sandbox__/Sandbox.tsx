import { useRef, useState } from 'react'
import styled from 'styled-components'

import { flatfileImporter } from '../src'
import { sign } from './utils/jwt'

const Output = styled.textarea`
  width: 100%;
  margin-top: 3rem;
  background-color: #404551;
  padding: 1rem;
  background-color: #404551;
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

  const [output, setOutput] = useState<string>()

  const [embedId, setEmbedId] = useState(localStorage.getItem('embed_id') || '')
  const [endUserEmail, setEndUserEmail] = useState(localStorage.getItem('end_user_email') || '')
  const [privateKey, setPrivateKey] = useState(localStorage.getItem('private_key') || '')

  const handleInit = async (file?: File, configs = {}) => {
    if (!embedId || !endUserEmail || !privateKey) {
      return alert('Embed id, user email & private key are required fields.')
    }

    localStorage.setItem('embed_id', embedId)
    localStorage.setItem('end_user_email', endUserEmail)
    localStorage.setItem('private_key', privateKey)

    const token = await sign(
      {
        embed: embedId,
        sub: endUserEmail,
      },
      privateKey
    )

    const importer = flatfileImporter(token, { env: 'development' }).launch({
      file,
      ...configs,
    })

    const handleLog = (type: string, data: any) => {
      console.log({ type, data })
    }

    importer.on('init', (payload: any) => handleLog('init', payload))
    importer.on('upload', (payload: any) => handleLog('upload', payload))
    importer.on('error', (payload: any) => handleLog('error', payload))
    importer.on('launch', (payload: any) => handleLog('launch', payload))
    importer.on('close', (payload: any) => handleLog('close', payload))
    importer.on('complete', async ({ payload }: any) => {
      handleLog('complete', payload)

      importer.close()
      setOutput(JSON.stringify(await payload.data(), null, 4))
    })

    importerRef.current = importer
  }

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

        <ButtonGroup>
          <Button onClick={() => handleInit()}>Launch</Button>
        </ButtonGroup>

        <Output readOnly placeholder='Data will appear here...' value={output} />
      </Container>
    </Wrapper>
  )
}
