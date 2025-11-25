import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChannelManager } from './components/ChannelManager';
import { NewsFeed } from './components/NewsFeed';
import { Navbar } from './components/Navbar';

function App() {
  return (
    <Router>
      <div className="min-vh-100 bg-light">
        <Navbar />
        <div className="container">
          <Routes>
            <Route path="/" element={<NewsFeed />} />
            <Route path="/channels" element={<ChannelManager />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
