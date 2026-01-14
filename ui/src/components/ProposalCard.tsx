/**
 * ProposalCard Component
 * 
 * Displays a single AI proposal with accept/reject/park actions.
 */

import { motion } from 'framer-motion';
import { Check, X, Clock, Brain, AlertTriangle, HelpCircle, Lightbulb } from 'lucide-react';
import type { Proposal } from '../lib/api';
import './ProposalCard.css';

interface ProposalCardProps {
    proposal: Proposal;
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
    onPark: (id: string) => void;
    isLoading?: boolean;
}

const TYPE_ICONS = {
    decision: Lightbulb,
    assumption: Brain,
    risk: AlertTriangle,
    question: HelpCircle,
};

const TYPE_LABELS = {
    decision: 'Decision',
    assumption: 'Assumption',
    risk: 'Risk',
    question: 'Question',
};

export function ProposalCard({ proposal, onAccept, onReject, onPark, isLoading }: ProposalCardProps) {
    const content = parseContent(proposal.content);
    const Icon = TYPE_ICONS[proposal.proposalType] || Brain;
    const confidence = proposal.confidence ?? 0;
    const confidenceClass = confidence >= 0.8 ? 'high' : confidence >= 0.5 ? 'medium' : 'low';

    return (
        <motion.div
            className="proposal-card glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            layout
        >
            {/* Header */}
            <div className="proposal-header">
                <div className="proposal-type">
                    <span className={`badge badge-${proposal.proposalType}`}>
                        <Icon size={12} />
                        {TYPE_LABELS[proposal.proposalType]}
                    </span>
                </div>
                <div className="proposal-meta">
                    {proposal.modelUsed && (
                        <span className="model-tag">{proposal.modelUsed}</span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="proposal-content">
                <p className="proposal-statement">{content.statement}</p>
                {content.context && (
                    <blockquote className="proposal-context">
                        "{content.context}"
                    </blockquote>
                )}
            </div>

            {/* Confidence */}
            <div className="proposal-confidence">
                <span className="confidence-label">AI Confidence</span>
                <span className="confidence-value">{Math.round(confidence * 100)}%</span>
                <div className="confidence-meter">
                    <div
                        className={`confidence-meter-fill confidence-${confidenceClass}`}
                        style={{ width: `${confidence * 100}%` }}
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="proposal-actions">
                <motion.button
                    className="btn btn-success"
                    onClick={() => onAccept(proposal.id)}
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Check size={16} />
                    Accept
                </motion.button>
                <motion.button
                    className="btn btn-ghost"
                    onClick={() => onPark(proposal.id)}
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Clock size={16} />
                    Park
                </motion.button>
                <motion.button
                    className="btn btn-danger"
                    onClick={() => onReject(proposal.id)}
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <X size={16} />
                    Reject
                </motion.button>
            </div>
        </motion.div>
    );
}

function parseContent(contentJson: string): { statement: string; context?: string } {
    try {
        return JSON.parse(contentJson);
    } catch {
        return { statement: contentJson };
    }
}
