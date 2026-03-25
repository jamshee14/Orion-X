import React, { useState } from "react";
import toast from 'react-hot-toast';
import { generateQuizAI, createQuiz } from "../services/api";

const QuizGenerator = ({ notes, onQuizCreated }) => {
    const [selectedNoteId, setSelectedNoteId] = useState("");
    const [numQuestions, setNumQuestions] = useState(5);
    const [timerMinutes, setTimerMinutes] = useState(10);
    const [loading, setLoading] = useState(false);
    const [generatedQuiz, setGeneratedQuiz] = useState(null);
    const [editedQuestions, setEditedQuestions] = useState([]);
    const [showAnswers, setShowAnswers] = useState(true);

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!selectedNoteId) {
            setLoading(false);
            toast.error('Please select a module. Questions are generated from its PDF content.');
            return;
        }

        const promise = generateQuizAI({
            noteId: selectedNoteId,
            numQuestions: numQuestions,
            timerMinutes: timerMinutes
        });

        toast.promise(promise, {
            loading: 'Generating AI Quiz...',
            success: (res) => {
                const data = res.data || {};
                const qs = Array.isArray(data.questions) ? data.questions : [];
                setGeneratedQuiz({ ...data, questions: qs });
                setEditedQuestions(qs.map(q => ({ ...q })));
                setTimerMinutes(data.timer_minutes ?? timerMinutes);
                setLoading(false);
                const looksPlaceholder = (s) => {
                    if (!s) return false;
                    const v = String(s).toLowerCase().trim();
                    return v.includes('option 1') || v.includes('option 2') || v.includes('option 3') || v.includes('option 4')
                        || v.includes('statement a') || v.includes('statement b') || v.includes('statement c') || v.includes('statement d')
                        || v.includes('idea a') || v.includes('idea b') || v.includes('idea c') || v.includes('idea d');
                };
                const bad = qs.some(q =>
                    looksPlaceholder(q.option_a) || looksPlaceholder(q.option_b) || looksPlaceholder(q.option_c) || looksPlaceholder(q.option_d)
                );
                if (bad) {
                    toast.error('These options look generic. Try generating again or provide a more specific topic/note.');
                }
                return 'Quiz generated successfully!';
            },
            error: (err) => {
                setLoading(false);
                if (err?.response?.status === 403) {
                    return 'Only teachers can generate quizzes.';
                }
                return 'Failed to generate quiz.';
            }
        });
    };

    const updateQuestion = (idx, key, value) => {
        setEditedQuestions(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], [key]: value };
            return next;
        });
    };

    const resetEdits = () => {
        setEditedQuestions(generatedQuiz?.questions?.map(q => ({ ...q })) || []);
        toast.success('Restored AI version');
    };

    const handleSaveQuiz = async () => {
        if (!generatedQuiz) return;

        const looksPlaceholder = (s) => {
            if (!s) return false;
            const v = String(s).toLowerCase().trim();
            return v.includes('option 1') || v.includes('option 2') || v.includes('option 3') || v.includes('option 4')
                || v.includes('statement a') || v.includes('statement b') || v.includes('statement c') || v.includes('statement d')
                || v.includes('idea a') || v.includes('idea b') || v.includes('idea c') || v.includes('idea d');
        };

        const bad = editedQuestions.some(q => {
            const ca = (q.correct_answer || '').toLowerCase();
            return !q.text || !q.option_a || !q.option_b || !q.option_c || !q.option_d
                || looksPlaceholder(q.option_a) || looksPlaceholder(q.option_b) || looksPlaceholder(q.option_c) || looksPlaceholder(q.option_d)
                || !['a', 'b', 'c', 'd'].includes(ca);
        });
        if (bad) {
            toast.error('Please refine questions and options before saving.');
            return;
        }

        const quizData = {
            title: generatedQuiz.title,
            description: generatedQuiz.description,
            timer_minutes: timerMinutes,
            questions: editedQuestions,
            note_id: selectedNoteId ? parseInt(selectedNoteId) : null,
        };

        const promise = createQuiz(quizData);
        toast.promise(promise, {
            loading: 'Saving quiz...',
            success: () => {
                setGeneratedQuiz(null);
                setEditedQuestions([]);
                setSelectedNoteId("");
                setNumQuestions(5);
                setTimerMinutes(10);
                if (onQuizCreated) onQuizCreated();
                return 'Quiz saved and published!';
            },
            error: (err) => {
                console.error("Detailed save error:", err.response?.data || err.message);
                return 'Failed to save quiz.';
            }
        });
    };

    return (
        <div className="quiz-generator">
            {!generatedQuiz ? (
                <form onSubmit={handleGenerate}>
                    {/* Info banner */}
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <span style={{ fontSize: '18px' }}>📄</span>
                        <p style={{ margin: 0, fontSize: '13px', color: '#1e40af', lineHeight: 1.5 }}>
                            <strong>AI reads your PDF.</strong> Select a module below — the AI will read its uploaded PDF content and generate quiz questions directly from it.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>1. Select Module (PDF)</label>
                            <select
                                className="auth-input"
                                value={selectedNoteId}
                                onChange={(e) => setSelectedNoteId(e.target.value)}
                                style={{ background: '#fff' }}
                                required
                            >
                                <option value="" disabled>— Choose a module to read —</option>
                                {notes.map(note => (
                                    <option key={note.id} value={note.id}>{note.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>2. Number of Questions</label>
                            <input
                                type="number"
                                className="auth-input"
                                value={numQuestions}
                                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                                min="1"
                                max="20"
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>3. Timer (Minutes)</label>
                            <input
                                type="number"
                                className="auth-input"
                                value={timerMinutes}
                                onChange={(e) => setTimerMinutes(parseInt(e.target.value))}
                                min="1"
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading || !selectedNoteId} style={{ width: 'auto', padding: '14px 40px', borderRadius: '14px', background: '#0f172a', fontWeight: '700' }}>
                        {loading ? "AI is Reading PDF... 🧠" : "Generate Quiz from PDF 🤖"}
                    </button>
                </form>
            ) : (
                <div className="generated-quiz-preview">
                    <h3 style={{ marginBottom: '16px' }}>Preview: {generatedQuiz.title}</h3>

                    <div style={{ marginBottom: '20px', padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Set Quiz Timer (Minutes)</label>
                        <input
                            type="number"
                            className="auth-input"
                            style={{ width: '100px', marginBottom: 0 }}
                            value={timerMinutes}
                            onChange={(e) => setTimerMinutes(parseInt(e.target.value))}
                            min="1"
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <button className="auth-btn" onClick={() => setShowAnswers(s => !s)} style={{ width: 'auto', padding: '0 20px', background: '#0f172a' }}>
                            {showAnswers ? 'Hide Answers' : 'Show Answers'}
                        </button>
                        <button className="auth-btn" onClick={resetEdits} style={{ width: 'auto', padding: '0 20px', background: '#fff', color: '#000', border: '1px solid #dbdbdb' }}>
                            Restore AI Version
                        </button>
                    </div>

                    <div className="questions-preview" style={{ maxHeight: '420px', overflowY: 'auto', marginBottom: '20px', display: 'grid', gap: '16px' }}>
                        {editedQuestions.map((q, idx) => (
                            <div key={idx} className="section-card" style={{ padding: '16px' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                                    <span style={{ fontWeight: '800' }}>Q{idx + 1}</span>
                                    <input
                                        className="auth-input"
                                        value={q.text || ''}
                                        onChange={(e) => updateQuestion(idx, 'text', e.target.value)}
                                        placeholder="Question text"
                                        style={{ flex: 1, background: '#fff' }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ width: 22, fontWeight: 700 }}>A</span>
                                        <input className="auth-input" value={q.option_a || ''} onChange={(e) => updateQuestion(idx, 'option_a', e.target.value)} placeholder="Option A" style={{ flex: 1, background: '#fff' }} />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ width: 22, fontWeight: 700 }}>B</span>
                                        <input className="auth-input" value={q.option_b || ''} onChange={(e) => updateQuestion(idx, 'option_b', e.target.value)} placeholder="Option B" style={{ flex: 1, background: '#fff' }} />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ width: 22, fontWeight: 700 }}>C</span>
                                        <input className="auth-input" value={q.option_c || ''} onChange={(e) => updateQuestion(idx, 'option_c', e.target.value)} placeholder="Option C" style={{ flex: 1, background: '#fff' }} />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ width: 22, fontWeight: 700 }}>D</span>
                                        <input className="auth-input" value={q.option_d || ''} onChange={(e) => updateQuestion(idx, 'option_d', e.target.value)} placeholder="Option D" style={{ flex: 1, background: '#fff' }} />
                                    </div>
                                </div>
                                {showAnswers && (
                                    <div style={{ marginTop: '12px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: 700, color: '#059669', marginRight: '8px' }}>Correct</label>
                                        <select className="auth-input" value={(q.correct_answer || '').toLowerCase()} onChange={(e) => updateQuestion(idx, 'correct_answer', e.target.value.toLowerCase())} style={{ width: 120, background: '#fff' }}>
                                            <option value="a">A</option>
                                            <option value="b">B</option>
                                            <option value="c">C</option>
                                            <option value="d">D</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="auth-btn" onClick={handleSaveQuiz} style={{ width: 'auto', padding: '0 32px' }}>
                            Save & Publish Quiz
                        </button>
                        <button
                            className="auth-btn"
                            onClick={() => { setGeneratedQuiz(null); setEditedQuestions([]); }}
                            style={{ width: 'auto', padding: '0 32px', background: '#fff', color: '#000', border: '1px solid #dbdbdb' }}
                        >
                            Discard
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizGenerator;
