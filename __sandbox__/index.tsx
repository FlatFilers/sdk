import React from 'react'
import ReactDOM from 'react-dom'
import { createGlobalStyle } from 'styled-components'

import { Sandbox } from './Sandbox'

const rootElement = document.getElementById('root')

const GlobalStyles = createGlobalStyle`
  html, body {
    font-size: 16px;
  }
`

ReactDOM.render(
  <React.StrictMode>
    <GlobalStyles />
    <Sandbox />
  </React.StrictMode>,
  rootElement
)
