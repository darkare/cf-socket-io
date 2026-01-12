import { useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import cloudflareLogo from './assets/Cloudflare_Logo.svg'
import './App.css'
import SocketPage from './SocketPage'

function Home() {
  const [count, setCount] = useState(0)
  const [name, setName] = useState('unknown')

  return (
    <>
      <div>
        <a href='https://vite.dev' target='_blank'>
          <img src={viteLogo} className='logo' alt='Vite logo' />
        </a>
        <a href='https://react.dev' target='_blank'>
          <img src={reactLogo} className='logo react' alt='React logo' />
        </a>
        <a href='https://workers.cloudflare.com/' target='_blank'>
          <img src={cloudflareLogo} className='logo cloudflare' alt='Cloudflare logo' />
        </a>
      </div>
      <h1>Vite + React + Cloudflare</h1>
      <div className='card'>
        <button
          onClick={() => setCount((count) => count + 1)}
          aria-label='increment'
        >
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <div className='card'>
        <button
          onClick={() => {
            fetch('/api/name')
              .then((res) => res.json() as Promise<{ name: string }>)
              .then((data) => setName(data.name))
          }}
          aria-label='get name'
        >
          Name from API is: {name}
        </button>
        <p>
          Edit <code>worker/index.ts</code> to change the name
        </p>
      </div>
      <div className='card'>
        <Link to="/socket">
          <button style={{ background: '#f6821f', color: 'white' }}>
            Go to Socket Demo
          </button>
        </Link>
      </div>
      <p className='read-the-docs'>
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/socket" element={<SocketPage />} />
    </Routes>
  )
}

export default App
