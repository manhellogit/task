import { SocketProvider } from './contexts/SocketContext';
import EditorPage from './pages/EditorPage';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <SocketProvider>
      <Router>
        <div className="App min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          <Routes>
            <Route path="/" element={<EditorPage />} />
          </Routes>
        </div>
      </Router>
    </SocketProvider>
  );
}

export default App;