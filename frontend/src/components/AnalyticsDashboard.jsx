import React, { useEffect, useState } from "react";
import { fetchQuizAnalytics } from "../services/api";
import { motion } from "framer-motion";
import { 
    BarChart3, 
    Users, 
    Target, 
    AlertTriangle, 
    ArrowLeft,
    TrendingUp,
    CheckCircle2
} from "lucide-react";

void motion;

const AnalyticsDashboard = ({ quizId, onClose }) => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAnalytics = async () => {
            try {
                const res = await fetchQuizAnalytics(quizId);
                setAnalytics(res.data);
            } catch (err) {
                console.error("Failed to fetch analytics", err);
            } finally {
                setLoading(false);
            }
        };
        loadAnalytics();
    }, [quizId]);

    if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}>Analyzing student performance...</div>;
    if (!analytics) return <div style={{ textAlign: 'center', padding: '100px' }}>No performance data available yet.</div>;

    return (
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="dashboard-sections"
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <motion.button 
                    whileHover={{ scale: 1.1, background: '#f1f5f9' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    style={{ 
                        padding: '12px', 
                        borderRadius: '12px', 
                        border: '1px solid #e2e8f0', 
                        background: '#fff', 
                        cursor: 'pointer',
                        color: '#64748b'
                    }}
                >
                    <ArrowLeft size={20} />
                </motion.button>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800' }}>Performance Analytics</h1>
            </div>

            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
                <motion.div 
                    whileHover={{ y: -5 }}
                    className="section-card" 
                    style={{ padding: '24px', background: '#eff6ff', border: '1px solid #dbeafe' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ padding: '10px', background: '#3b82f6', color: '#fff', borderRadius: '12px' }}>
                            <Users size={20} />
                        </div>
                        <TrendingUp size={16} color="#3b82f6" />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#1d4ed8', opacity: 0.7 }}>TOTAL ATTEMPTS</span>
                    <h2 style={{ fontSize: '36px', fontWeight: '900', color: '#1d4ed8', margin: '4px 0 0 0' }}>{analytics.attempt_count}</h2>
                </motion.div>

                <motion.div 
                    whileHover={{ y: -5 }}
                    className="section-card" 
                    style={{ padding: '24px', background: '#ecfdf5', border: '1px solid #d1fae5' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ padding: '10px', background: '#059669', color: '#fff', borderRadius: '12px' }}>
                            <Target size={20} />
                        </div>
                        <CheckCircle2 size={16} color="#059669" />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#065f46', opacity: 0.7 }}>AVERAGE SCORE</span>
                    <h2 style={{ fontSize: '36px', fontWeight: '900', color: '#065f46', margin: '4px 0 0 0' }}>{analytics.average_score.toFixed(1)}%</h2>
                </motion.div>

                <motion.div 
                    whileHover={{ y: -5 }}
                    className="section-card" 
                    style={{ padding: '24px', background: '#fff7ed', border: '1px solid #ffedd5' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ padding: '10px', background: '#ea580c', color: '#fff', borderRadius: '12px' }}>
                            <BarChart3 size={20} />
                        </div>
                        <AlertTriangle size={16} color="#ea580c" />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#9a3412', opacity: 0.7 }}>QUIZ TITLE</span>
                    <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#9a3412', margin: '12px 0 0 0' }}>{analytics.title}</h2>
                </motion.div>
            </div>

            <section className="section-card" style={{ padding: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
                    <AlertTriangle size={22} color="#ea580c" />
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>Most Missed Questions</h2>
                </div>
                
                <div className="missed-questions-list" style={{ display: 'grid', gap: '20px' }}>
                    {analytics.most_missed_questions.length === 0 ? (
                        <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No student attempts yet. Analytics will appear once students complete the quiz.</p>
                    ) : (
                        analytics.most_missed_questions.map((q, idx) => {
                            const missRate = (q.miss_count / q.total_attempts) * 100;
                            return (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    key={q.question_id} 
                                    style={{ 
                                        padding: '24px', 
                                        background: '#fff', 
                                        borderRadius: '20px', 
                                        border: '1px solid #f1f5f9',
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#334155', maxWidth: '80%' }}>{q.text}</p>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#ef4444' }}>{missRate.toFixed(0)}% MISSED</span>
                                            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{q.miss_count} of {q.total_attempts} attempts</p>
                                        </div>
                                    </div>
                                    
                                    <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${missRate}%` }}
                                            transition={{ duration: 1, delay: idx * 0.1 }}
                                            style={{ height: '100%', background: missRate > 50 ? '#ef4444' : '#f97316' }}
                                        />
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </section>
        </motion.div>
    );
};

export default AnalyticsDashboard;
