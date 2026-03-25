import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, X, Loader } from 'lucide-react';
import { postChatMessage } from '../services/api';

void motion;

const TutorChat = ({ note, onClose }) => {
    const [history, setHistory] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [history]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { role: 'user', parts: input };
        const newHistory = [...history, userMessage];
        setHistory(newHistory);
        setInput('');
        setIsLoading(true);

        try {
            const payload = {
                note_content: note ? `${note.title}\n\n${note.content}` : undefined,
                history: newHistory,
            };
            const res = await postChatMessage(payload);
            const modelMessage = { role: 'model', parts: res.data.reply };
            setHistory([...newHistory, modelMessage]);
        } catch {
            const errorMessage = { 
                role: 'model', 
                parts: 'Sorry, I encountered an error. Please try again.' 
            };
            setHistory([...newHistory, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="tutor-chat-container"
        >
            <div className="tutor-chat-header">
                <h3>{note ? <>AI Tutor for: <strong>{note.title}</strong></> : 'Orion‑X AI Tutor'}</h3>
                <button onClick={onClose} className="tutor-close-btn"><X size={20} /></button>
            </div>
            <div className="tutor-chat-history">
                {history.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.role}`}>
                        <p>{msg.parts}</p>
                    </div>
                ))}
                {isLoading && (
                    <div className="chat-message model loading">
                        <Loader className="animate-spin" size={20} />
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
            <div className="tutor-chat-input-area">
                <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={note ? "Ask a question about this module..." : "Ask about any topic in your library..."}
                    disabled={isLoading}
                />
                <button onClick={handleSend} disabled={isLoading}>
                    <Send size={20} />
                </button>
            </div>
        </motion.div>
    );
};

export default TutorChat;
