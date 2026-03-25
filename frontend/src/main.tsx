import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import App from './App'
import './index.css'
import './core/layouts/css/style.css'

const theme = {
  token: {
    colorPrimary: '#667eea',
    borderRadius: 9999,
    colorBgContainer: 'transparent',
  },
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider theme={theme}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>,
)
