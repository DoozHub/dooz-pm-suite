import { Routes, Route } from 'react-router'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Intents from './pages/Intents'
import IntentDetail from './pages/IntentDetail'
import DecisionLedger from './pages/DecisionLedger'
import Assumptions from './pages/Assumptions'
import KnowledgeGraph from './pages/KnowledgeGraph'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/intents" element={<Intents />} />
        <Route path="/intents/:id" element={<IntentDetail />} />
        <Route path="/intents/:id/decisions" element={<DecisionLedger />} />
        <Route path="/intents/:id/assumptions" element={<Assumptions />} />
        <Route path="/knowledge-graph" element={<KnowledgeGraph />} />
      </Routes>
    </Layout>
  )
}

export default App
