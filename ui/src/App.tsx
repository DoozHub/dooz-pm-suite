import { useState } from 'react';
import './index.css';
import { IntentDashboard } from './pages/IntentDashboard';
import './pages/IntentDashboard.css';
import { ProposalReview } from './pages/ProposalReview';
import './pages/ProposalReview.css';
import { GraphPage } from './pages/GraphPage';
import './pages/GraphPage.css';
import './components/ContentUploader.css';
import { Layout, Brain, Target, Network } from 'lucide-react';

type Page = 'dashboard' | 'review' | 'graph';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  return (
    <div className="app">
      {/* Navigation */}
      <nav className="app-nav">
        <div className="nav-brand">
          <Layout size={20} />
          <span>PM Suite</span>
        </div>
        <div className="nav-links">
          <button
            className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            <Target size={16} />
            Intents
          </button>
          <button
            className={`nav-link ${currentPage === 'review' ? 'active' : ''}`}
            onClick={() => setCurrentPage('review')}
          >
            <Brain size={16} />
            AI Review
          </button>
          <button
            className={`nav-link ${currentPage === 'graph' ? 'active' : ''}`}
            onClick={() => setCurrentPage('graph')}
          >
            <Network size={16} />
            Graph
          </button>
        </div>
      </nav>

      {/* Page Content */}
      <main className="app-content">
        {currentPage === 'dashboard' && <IntentDashboard />}
        {currentPage === 'review' && <ProposalReview />}
        {currentPage === 'graph' && <GraphPage />}
      </main>
    </div>
  );
}

export default App;
