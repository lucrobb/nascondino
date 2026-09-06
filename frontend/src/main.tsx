import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import LobbyBuilder from './pages/LobbyBuilder'
import GameRoom from './pages/GameRoom'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/build" element={<LobbyBuilder />} />
        <Route path="/lobby/:roomCode" element={<GameRoom />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)