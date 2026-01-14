/**
 * ContentUploader Component
 * 
 * Allows users to paste or upload content for AI extraction.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Loader2 } from 'lucide-react';
import './ContentUploader.css';

interface ContentUploaderProps {
    onSubmit: (content: string, sourceType: string) => Promise<void>;
    isLoading?: boolean;
}

const SOURCE_TYPES = [
    { value: 'chatgpt_export', label: 'ChatGPT Export' },
    { value: 'claude_export', label: 'Claude Export' },
    { value: 'text_file', label: 'Text/Notes' },
    { value: 'email_thread', label: 'Email Thread' },
    { value: 'meeting_notes', label: 'Meeting Notes' },
];

export function ContentUploader({ onSubmit, isLoading }: ContentUploaderProps) {
    const [content, setContent] = useState('');
    const [sourceType, setSourceType] = useState('text_file');

    const handleSubmit = async () => {
        if (!content.trim()) return;
        await onSubmit(content, sourceType);
        setContent('');
    };

    return (
        <div className="content-uploader glass-card">
            <div className="uploader-header">
                <FileText size={20} />
                <h3>Upload Content for AI Extraction</h3>
            </div>

            <div className="uploader-form">
                <div className="form-group">
                    <label>Source Type</label>
                    <select
                        value={sourceType}
                        onChange={(e) => setSourceType(e.target.value)}
                        className="form-select"
                    >
                        {SOURCE_TYPES.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Content</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Paste chat export, meeting notes, or any text content..."
                        rows={8}
                        className="form-textarea"
                    />
                </div>

                <motion.button
                    className="btn btn-primary upload-btn"
                    onClick={handleSubmit}
                    disabled={isLoading || !content.trim()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {isLoading ? (
                        <>
                            <Loader2 size={16} className="spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Upload size={16} />
                            Extract with AI
                        </>
                    )}
                </motion.button>
            </div>
        </div>
    );
}
