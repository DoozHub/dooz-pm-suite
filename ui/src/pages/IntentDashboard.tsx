/**
 * Intent Dashboard Page
 * 
 * Main dashboard for managing intents and their linked entities.
 */

import { useState, useEffect, useCallback } from 'react';
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
    onTransition
}: {
    intent: Intent;
    onTransition: (id: string, state: string) => void;
}) {
    const StateIcon = STATE_ICONS[intent.currentState as keyof typeof STATE_ICONS] || HelpCircle;

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
                <div className="stat-card">
                    <GitBranch size={20} />
                    <div className="stat-info">
                        <span className="stat-value">0</span>
                        <span className="stat-label">Decisions</span>
                    </div>
                </div>
                <div className="stat-card">
                    <Brain size={20} />
                    <div className="stat-info">
                        <span className="stat-value">0</span>
                        <span className="stat-label">Assumptions</span>
                    </div>
                </div>
                <div className="stat-card">
                    <AlertTriangle size={20} />
                    <div className="stat-info">
                        <span className="stat-value">0</span>
                        <span className="stat-label">Risks</span>
                    </div>
                </div>
                <div className="stat-card">
                    <CheckSquare size={20} />
                    <div className="stat-info">
                        <span className="stat-value">0</span>
                        <span className="stat-label">Tasks</span>
                    </div>
                </div>
            </div>

            {/* Metadata */}
            <div className="intent-metadata">
                <div className="meta-item">
                    <Clock size={14} />
                    <span>Created: {intent.createdAt ? new Date(intent.createdAt).toLocaleDateString() : 'Unknown'}</span>
                </div>
                <div className="meta-item">
                    <span>Created by: {intent.createdBy}</span>
                </div>
            </div>
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
