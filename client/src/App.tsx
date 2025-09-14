// client/src/App.tsx
import { SocketProvider } from './contexts/SocketContext';
import EditorPage from './pages/EditorPage';
import EmailLogin from './components/EmailLogin';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <SocketProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Protected editor at root */}
            <Route path="/" element={<EditorPage />} />
            {/* Dedicated email login page */}
            <Route path="/email" element={<EmailLogin />} />
            {/* Fallback: redirect unknown paths to root */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </SocketProvider>
  );
}

export default App;
