import logo from './logo.svg';
import './App.css';
import Nav from './navigation';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UnreadProvider } from './UnreadContext';
import SearchResults from './searchresults';
import '@fortawesome/fontawesome-free/css/all.min.css';

function App() {
  return (
    <UnreadProvider>
      <div className="background_blur">
        <Router>
          <Nav /> {/* Single navigation with integrated search */}
          <Routes>
            <Route path="/search" element={<SearchResults />} />
            <Route path="/project/:id" element={<div>Project Detail Page</div>} /> {/* Placeholder */}
            <Route path="/postproject" element={<div>Post Project Page</div>} /> {/* Placeholder */}
            <Route path="/logout" element={<div>Logout Page</div>} /> {/* Placeholder */}
            {/* Add other routes as needed */}
          </Routes>
        </Router>
      </div>
    </UnreadProvider>
  );
}

export default App;