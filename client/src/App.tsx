import { SocketProvider } from './contexts/SocketContext';
import EditorPage from './pages/EditorPage';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <SocketProvider>
      <Router>
        <div className="App min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<EditorPage />} />
            <Route path="/document/:documentId" element={<EditorPage />} />
          </Routes>
        </div>
      </Router>
    </SocketProvider>
  );
}

export default App;