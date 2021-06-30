import { FC } from 'react'

import { flatfileImporter } from '../src'

const btnStyles = {
  border: '1px solid transparent',
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'inline-block',
  fontSize: '18px',
  fontWeight: 500,
  letterSpacing: '0.015em',
  padding: '8px 12px',
  textDecoration: 'none',
  transition: 'background-color 0.1s linear 0s, box-shadow 0.2s ease 0s',
  boxShadow: `rgb(121 76 255 / 30%) 0px 1px 8px -2px, rgb(121 76 255 / 20%) 0px 2px 12px -3px`,
  backgroundColor: `rgb(121, 76, 255)`,
  color: `rgb(255, 255, 255)`,
}

export const Sandbox: FC = () => {
  const token = process.env.API_TOKEN ?? ''
  const handleClick = () => flatfileImporter(token).launch()

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#f6fafc',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {process.env.API_TOKEN ? (
        <button onClick={handleClick} style={btnStyles}>
          start
        </button>
      ) : (
        <h2>API token not found. Ensure your .env file has been created and populated</h2>
      )}
    </div>
  )
}
