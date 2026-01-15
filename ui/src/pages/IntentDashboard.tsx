/**
 * Intent Dashboard Page
 * 
 * Main dashboard for managing intents and their linked entities.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Target,
    GitBranch,
    AlertTriangle,
    HelpCircle,
    CheckSquare,
    ChevronRight,
    Brain,
    Clock,
    Archive,
    Play
} from 'lucide-react';
import { api, type Intent } from '../lib/api';
import './IntentDashboard.css';

const STATE_ICONS = {
    research: HelpCircle,
    planning: Brain,
    execution: Play,
    archived: Archive,
};

const STATE_COLORS = {
    research: '#3B82F6',
    planning: '#F59E0B',
    execution: '#10B981',
    archived: '#6B7280',
};

export function IntentDashboard() {
    const [intents, setIntents] = useState<Intent[]>([]);
    const [selectedIntent, setSelectedIntent] = useState<Intent | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        loadIntents();
    }, []);

    const loadIntents = async () => {
        setIsLoading(true);
        const result = await api.listIntents();
        if (result.data) {
            setIntents(result.data);
        }
        setIsLoading(false);
    };

    const handleCreate = async (title: string, description: string) => {
        const result = await api.createIntent({ title, description });
        if (result.data) {
            setIntents([result.data, ...intents]);
            setShowCreateModal(false);
        }
    };

    const handleTransition = async (intentId: string, newState: string) => {
        const result = await api.transitionIntent(intentId, newState);
        if (result.data) {
            setIntents(intents.map(i => i.id === intentId ? result.data! : i));
            if (selectedIntent?.id === intentId) {
                setSelectedIntent(result.data);
            }
        }
    };

    return (
        <div className="intent-dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-title">
                    <Target size={28} className="header-icon" />
                    <div>
                        <h1>Intent Dashboard</h1>
                        <p className="subtitle">Manage intents through their lifecycle</p>
                    </div>
                </div>
                <motion.button
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Plus size={16} />
                    New Intent
                </motion.button>
            </header>

            {/* Main Content */}
            <div className="dashboard-layout">
                {/* Intent List */}
                <aside className="intent-list">
                    <h2 className="section-title">
                        All Intents
                        <span className="count-badge">{intents.length}</span>
                    </h2>

                    {isLoading ? (
                        <div className="loading-state">Loading...</div>
                    ) : intents.length === 0 ? (
                        <div className="empty-state-small">
                            <Target size={32} />
                            <p>No intents yet</p>
                        </div>
                    ) : (
                        <div className="intent-cards">
                            <AnimatePresence>
                                {intents.map((intent) => {
                                    const StateIcon = STATE_ICONS[intent.currentState as keyof typeof STATE_ICONS] || HelpCircle;
                                    const isSelected = selectedIntent?.id === intent.id;

                                    return (
                                        <motion.div
                                            key={intent.id}
                                            className={`intent-card ${isSelected ? 'selected' : ''}`}
                                            onClick={() => setSelectedIntent(intent)}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            layout
                                        >
                                            <div className="intent-card-header">
                                                <StateIcon
                                                    size={16}
                                                    style={{ color: STATE_COLORS[intent.currentState as keyof typeof STATE_COLORS] }}
                                                />
                                                <span className="intent-state">{intent.currentState}</span>
                                            </div>
                                            <h3 className="intent-title">{intent.title}</h3>
                                            <ChevronRight size={16} className="chevron" />
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </aside>

                {/* Intent Detail */}
                <main className="intent-detail">
                    {selectedIntent ? (
                        <IntentDetailView
                            intent={selectedIntent}
                            onTransition={handleTransition}
                        />
                    ) : (
                        <div className="empty-state glass-card">
                            <Target size={48} className="empty-icon" />
                            <h3>Select an intent</h3>
                            <p>Choose an intent from the list to view details</p>
                        </div>
                    )}
                </main>
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <CreateIntentModal
                        onClose={() => setShowCreateModal(false)}
                        onCreate={handleCreate}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Intent Detail View Component
function IntentDetailView({
    intent,
    onTransition,
    onDecisionCommit
}: {
    intent: Intent;
    onTransition: (id: string, state: string) => void;
    onDecisionCommit?: () => void;
}) {
    const StateIcon = STATE_ICONS[intent.currentState as keyof typeof STATE_ICONS] || HelpCircle;
    const [stats, setStats] = useState({ decisions: 0, assumptions: 0, risks: 0, tasks: 0 });
    const [showDecisionForm, setShowDecisionForm] = useState(false);
    const [decisions, setDecisions] = useState<import('../lib/api').Decision[]>([]);
    const [assumptions, setAssumptions] = useState<import('../lib/api').Assumption[]>([]);
    const [risks, setRisks] = useState<import('../lib/api').Risk[]>([]);
    const [tasks, setTasks] = useState<import('../lib/api').Task[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'decisions' | 'assumptions' | 'risks' | 'tasks'>('overview');
    const [_showAddForm, setShowAddForm] = useState<string | null>(null);

    useEffect(() => {
        loadStats();
        loadDecisions();
        loadAssumptions();
        loadRisks();
        loadTasks();
    }, [intent.id]);

    const loadStats = async () => {
        const result = await api.getIntentStats(intent.id);
        if (result.data) {
            setStats(result.data);
        }
    };

    const loadDecisions = async () => {
        const result = await api.listDecisions(intent.id);
        if (result.data) {
            setDecisions(result.data);
        }
    };

    const loadAssumptions = async () => {
        const result = await api.listAssumptions(intent.id);
        if (result.data) {
            setAssumptions(result.data);
        }
    };

    const loadRisks = async () => {
        const result = await api.listRisks(intent.id);
        if (result.data) {
            setRisks(result.data);
        }
    };

    const loadTasks = async () => {
        const result = await api.listTasks(intent.id);
        if (result.data) {
            setTasks(result.data);
        }
    };

    const handleDecisionCommit = async (data: {
        decisionStatement: string;
        finalChoice: string;
        optionsConsidered: string[];
    }) => {
        const result = await api.commitDecision({
            intentId: intent.id,
            ...data,
        });
        if (result.data) {
            setDecisions([result.data, ...decisions]);
            setStats({ ...stats, decisions: stats.decisions + 1 });
            setShowDecisionForm(false);
            onDecisionCommit?.();
        }
    };

    const getNextStates = (current: string): string[] => {
        const transitions: Record<string, string[]> = {
            research: ['planning'],
            planning: ['execution', 'research'],
            execution: ['archived', 'planning'],
            archived: [],
        };
        return transitions[current] || [];
    };

    const nextStates = getNextStates(intent.currentState || 'research');

    return (
        <div className="intent-detail-view glass-card">
            <div className="detail-header">
                <div className="detail-state">
                    <StateIcon
                        size={20}
                        style={{ color: STATE_COLORS[intent.currentState as keyof typeof STATE_COLORS] }}
                    />
                    <span className="state-label">{intent.currentState}</span>
                </div>
                <h2>{intent.title}</h2>
                {intent.description && <p className="detail-description">{intent.description}</p>}
            </div>

            {/* Transition Actions */}
            {nextStates.length > 0 && (
                <div className="transition-actions">
                    <span className="action-label">Transition to:</span>
                    {nextStates.map((state) => (
                        <motion.button
                            key={state}
                            className="btn btn-ghost"
                            onClick={() => onTransition(intent.id, state)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {state}
                        </motion.button>
                    ))}
                </div>
            )}

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card" onClick={() => setActiveTab('decisions')}>
                    <GitBranch size={20} />
                    <div className="stat-info">
                        <span className="stat-value">{stats.decisions}</span>
                        <span className="stat-label">Decisions</span>
                    </div>
                </div>
                <div className="stat-card" onClick={() => setActiveTab('assumptions')}>
                    <Brain size={20} />
                    <div className="stat-info">
                        <span className="stat-value">{stats.assumptions}</span>
                        <span className="stat-label">Assumptions</span>
                    </div>
                </div>
                <div className="stat-card" onClick={() => setActiveTab('risks')}>
                    <AlertTriangle size={20} />
                    <div className="stat-info">
                        <span className="stat-value">{stats.risks}</span>
                        <span className="stat-label">Risks</span>
                    </div>
                </div>
                <div className="stat-card" onClick={() => setActiveTab('tasks')}>
                    <CheckSquare size={20} />
                    <div className="stat-info">
                        <span className="stat-value">{stats.tasks}</span>
                        <span className="stat-label">Tasks</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="detail-tabs">
                <button
                    className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button
                    className={`tab-btn ${activeTab === 'decisions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('decisions')}
                >
                    Decisions
                </button>
                <button
                    className={`tab-btn ${activeTab === 'assumptions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('assumptions')}
                >
                    Assumptions
                </button>
                <button
                    className={`tab-btn ${activeTab === 'risks' ? 'active' : ''}`}
                    onClick={() => setActiveTab('risks')}
                >
                    Risks
                </button>
                <button
                    className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tasks')}
                >
                    Tasks
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="intent-metadata">
                    <div className="meta-item">
                        <Clock size={14} />
                        <span>Created: {intent.createdAt ? new Date(intent.createdAt).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                    <div className="meta-item">
                        <span>Created by: {intent.createdBy}</span>
                    </div>
                </div>
            )}

            {activeTab === 'decisions' && (
                <div className="decisions-section">
                    <div className="section-header">
                        <h3>Decision Ledger</h3>
                        <motion.button
                            className="btn btn-primary btn-sm"
                            onClick={() => setShowDecisionForm(true)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Plus size={14} />
                            Commit Decision
                        </motion.button>
                    </div>
                    {decisions.length === 0 ? (
                        <p className="empty-text">No decisions yet. Commit your first decision.</p>
                    ) : (
                        <div className="decision-list">
                            {decisions.map((d) => (
                                <div key={d.id} className={`decision-card ${d.status}`}>
                                    <div className="decision-header">
                                        <span className={`status-badge ${d.status}`}>{d.status}</span>
                                        <span className="decision-date">
                                            {d.decisionTimestamp ? new Date(d.decisionTimestamp).toLocaleDateString() : ''}
                                        </span>
                                    </div>
                                    <p className="decision-statement">{d.decisionStatement}</p>
                                    <p className="decision-choice"><strong>Choice:</strong> {d.finalChoice}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Assumptions Tab */}
            {activeTab === 'assumptions' && (
                <div className="assumptions-section">
                    <div className="section-header">
                        <h3>Assumptions</h3>
                        <motion.button
                            className="btn btn-primary btn-sm"
                            onClick={() => setShowAddForm('assumption')}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Plus size={14} />
                            Add Assumption
                        </motion.button>
                    </div>
                    {assumptions.length === 0 ? (
                        <p className="empty-text">No assumptions yet. Add your first assumption.</p>
                    ) : (
                        <div className="entity-list">
                            {assumptions.map((a) => (
                                <div key={a.id} className={`entity-card ${a.status}`}>
                                    <div className="entity-header">
                                        <span className={`status-badge ${a.status}`}>{a.status}</span>
                                        {a.confidenceLevel && (
                                            <span className="confidence-badge">{Math.round(a.confidenceLevel * 100)}% confident</span>
                                        )}
                                    </div>
                                    <p className="entity-statement">{a.assumptionStatement}</p>
                                    <div className="entity-meta">
                                        <span>Source: {a.createdFrom || 'human'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Risks Tab */}
            {activeTab === 'risks' && (
                <div className="risks-section">
                    <div className="section-header">
                        <h3>Risk Register</h3>
                        <motion.button
                            className="btn btn-primary btn-sm"
                            onClick={() => setShowAddForm('risk')}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Plus size={14} />
                            Add Risk
                        </motion.button>
                    </div>
                    {risks.length === 0 ? (
                        <p className="empty-text">No risks identified yet.</p>
                    ) : (
                        <div className="entity-list">
                            {risks.map((r) => (
                                <div key={r.id} className={`entity-card risk-${r.severity || 'medium'}`}>
                                    <div className="entity-header">
                                        <span className={`severity-badge ${r.severity || 'medium'}`}>{r.severity || 'medium'}</span>
                                        <span className={`status-badge ${r.status}`}>{r.status}</span>
                                    </div>
                                    <p className="entity-statement">{r.riskStatement}</p>
                                    {r.mitigationNotes && (
                                        <p className="mitigation-notes"><strong>Mitigation:</strong> {r.mitigationNotes}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
                <div className="tasks-section">
                    <div className="section-header">
                        <h3>Tasks</h3>
                        <motion.button
                            className="btn btn-primary btn-sm"
                            onClick={() => setShowAddForm('task')}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Plus size={14} />
                            Add Task
                        </motion.button>
                    </div>
                    {tasks.length === 0 ? (
                        <p className="empty-text">No tasks yet. Break down the work into tasks.</p>
                    ) : (
                        <div className="task-list">
                            {tasks.map((t) => (
                                <div key={t.id} className={`task-card ${t.status}`}>
                                    <div className="task-check">
                                        <input
                                            type="checkbox"
                                            checked={t.status === 'done'}
                                            onChange={() => {
                                                const newStatus = t.status === 'done' ? 'todo' : 'done';
                                                api.updateTaskStatus(t.id, newStatus).then(() => loadTasks());
                                            }}
                                        />
                                    </div>
                                    <div className="task-content">
                                        <span className={`task-title ${t.status === 'done' ? 'completed' : ''}`}>{t.title}</span>
                                        {t.description && <p className="task-description">{t.description}</p>}
                                    </div>
                                    {t.owner && <span className="task-owner">{t.owner}</span>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Decision Form Modal */}
            <AnimatePresence>
                {showDecisionForm && (
                    <DecisionCommitModal
                        onClose={() => setShowDecisionForm(false)}
                        onCommit={handleDecisionCommit}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Create Intent Modal
function CreateIntentModal({
    onClose,
    onCreate
}: {
    onClose: () => void;
    onCreate: (title: string, description: string) => void;
}) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onCreate(title, description);
        }
    };

    return (
        <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="modal glass-card"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2>Create New Intent</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What do you intend to accomplish?"
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label>Description (optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Additional context..."
                            rows={3}
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={!title.trim()}>
                            <Plus size={16} />
                            Create Intent
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

// Decision Commit Modal
function DecisionCommitModal({
    onClose,
    onCommit
}: {
    onClose: () => void;
    onCommit: (data: { decisionStatement: string; finalChoice: string; optionsConsidered: string[] }) => void;
}) {
    const [decisionStatement, setDecisionStatement] = useState('');
    const [finalChoice, setFinalChoice] = useState('');
    const [optionsText, setOptionsText] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (decisionStatement.trim() && finalChoice.trim()) {
            const optionsConsidered = optionsText
                .split('\n')
                .map(o => o.trim())
                .filter(o => o.length > 0);
            onCommit({ decisionStatement, finalChoice, optionsConsidered });
        }
    };

    return (
        <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="modal glass-card decision-modal"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2>Commit Decision</h2>
                <p className="modal-subtitle">Decisions are immutable. Once committed, they cannot be edited - only superseded.</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Decision Statement *</label>
                        <textarea
                            value={decisionStatement}
                            onChange={(e) => setDecisionStatement(e.target.value)}
                            placeholder="What was decided? Be specific and complete."
                            rows={3}
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label>Final Choice *</label>
                        <input
                            type="text"
                            value={finalChoice}
                            onChange={(e) => setFinalChoice(e.target.value)}
                            placeholder="The specific option chosen"
                        />
                    </div>
                    <div className="form-group">
                        <label>Options Considered (one per line)</label>
                        <textarea
                            value={optionsText}
                            onChange={(e) => setOptionsText(e.target.value)}
                            placeholder="Option A&#10;Option B&#10;Option C"
                            rows={3}
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!decisionStatement.trim() || !finalChoice.trim()}
                        >
                            <GitBranch size={16} />
                            Commit Decision
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

