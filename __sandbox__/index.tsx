import React from 'react'
import ReactDOM from 'react-dom'

import { Sandbox } from './Sandbox'

const rootElement = document.getElementById('root')

ReactDOM.render(
  <React.StrictMode>
    <Sandbox />
  </React.StrictMode>,
  rootElement
)
