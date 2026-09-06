import { Toaster } from './components/ui/sonner';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import LobbyBuilder from './pages/LobbyBuilder';
import GameRoom from './pages/GameRoom';

export default function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/build" element={<LobbyBuilder />} />
          <Route path="/lobby/:roomCode" element={<GameRoom />} />
        </Routes>
      </BrowserRouter>
      <Toaster 
      toastOptions={{
        classNames: {
          toast: "rounded-none border-2 border-foreground shadow-none",
          title: "font-mono uppercase tracking-wide",
        },
      }}
      />
    </>
  )
}

