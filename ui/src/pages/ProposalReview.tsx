/**
 * ProposalReview Page
 * 
 * Main page for reviewing AI-generated proposals.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { api, type Proposal } from '../lib/api';
import { ProposalCard } from '../components/ProposalCard';
import { ContentUploader } from '../components/ContentUploader';
import './ProposalReview.css';

export function ProposalReview() {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [aiStatus, setAiStatus] = useState<{ available: boolean; message: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [stats, setStats] = useState({ accepted: 0, rejected: 0, parked: 0 });

    // Check AI status on mount
    useEffect(() => {
        api.aiStatus().then((res) => {
            if (res.data) {
                setAiStatus({ available: res.data.aiAvailable, message: res.data.message });
            }
        });
    }, []);

    // Handle content upload for extraction
    const handleUpload = useCallback(async (content: string, sourceType: string) => {
        setIsLoading(true);
        try {
            const result = await api.ingestContent({ content, sourceType });
            if (result.data?.proposals) {
                setProposals((prev) => [...result.data!.proposals, ...prev]);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Handle accept
    const handleAccept = useCallback(async (id: string) => {
        setActionLoading(id);
        try {
            await api.acceptProposal(id);
            setProposals((prev) => prev.filter((p) => p.id !== id));
            setStats((s) => ({ ...s, accepted: s.accepted + 1 }));
        } finally {
            setActionLoading(null);
        }
    }, []);

    // Handle reject
    const handleReject = useCallback(async (id: string) => {
        setActionLoading(id);
        try {
            await api.rejectProposal(id);
            setProposals((prev) => prev.filter((p) => p.id !== id));
            setStats((s) => ({ ...s, rejected: s.rejected + 1 }));
        } finally {
            setActionLoading(null);
        }
    }, []);

    // Handle park
    const handlePark = useCallback(async (id: string) => {
        setActionLoading(id);
        try {
            await api.parkProposal(id);
            setProposals((prev) => prev.filter((p) => p.id !== id));
            setStats((s) => ({ ...s, parked: s.parked + 1 }));
        } finally {
            setActionLoading(null);
        }
    }, []);

    const pendingCount = proposals.filter((p) => p.status === 'pending').length;

    return (
        <div className="proposal-review-page">
            {/* Header */}
            <header className="page-header">
                <div className="header-left">
                    <Brain size={28} className="header-icon" />
                    <div>
                        <h1>AI Review Queue</h1>
                        <p className="subtitle">Review and confirm AI-extracted proposals</p>
                    </div>
                </div>
                <div className="header-stats">
                    <div className="stat">
                        <CheckCircle size={16} className="stat-icon success" />
                        <span>{stats.accepted}</span>
                    </div>
                    <div className="stat">
                        <Clock size={16} className="stat-icon warning" />
                        <span>{stats.parked}</span>
                    </div>
                    <div className="stat">
                        <XCircle size={16} className="stat-icon danger" />
                        <span>{stats.rejected}</span>
                    </div>
                </div>
            </header>

            {/* AI Status Banner */}
            {aiStatus && !aiStatus.available && (
                <motion.div
                    className="status-banner warning"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <AlertTriangle size={18} />
                    <span>{aiStatus.message}</span>
                </motion.div>
            )}

            {/* Content Uploader */}
            <ContentUploader onSubmit={handleUpload} isLoading={isLoading} />

            {/* Proposals List */}
            <section className="proposals-section">
                <h2 className="section-title">
                    Pending Review
                    {pendingCount > 0 && (
                        <span className="count-badge">{pendingCount}</span>
                    )}
                </h2>

                {proposals.length === 0 ? (
                    <div className="empty-state glass-card">
                        <Brain size={48} className="empty-icon" />
                        <h3>No proposals to review</h3>
                        <p>Upload content above to extract decisions, assumptions, and risks using AI</p>
                    </div>
                ) : (
                    <div className="proposals-grid">
                        <AnimatePresence mode="popLayout">
                            {proposals.map((proposal) => (
                                <ProposalCard
                                    key={proposal.id}
                                    proposal={proposal}
                                    onAccept={handleAccept}
                                    onReject={handleReject}
                                    onPark={handlePark}
                                    isLoading={actionLoading === proposal.id}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </section>
        </div>
    );
}
