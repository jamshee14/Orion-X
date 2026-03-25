import React, { useEffect, useState, useCallback } from "react";
import toast from 'react-hot-toast';
import { fetchNotes, fetchQuizzes, logoutUser, fetchStudyPath, generateStudyPath, fetchMeetings } from "../services/api";
import QuizAttempt from "../components/QuizAttempt";
import StudyPathViewer from "../components/StudyPathViewer";
import { motion, AnimatePresence } from "framer-motion";
import {
    Library,
    FileQuestion,
    LogOut,
    Download,
    PlayCircle,
    Clock,
    Compass,
    Loader,
    MessageSquare
} from "lucide-react";
import TutorChat from "../components/TutorChat";

void motion;

const StudentDashboard = () => {
    const [notes, setNotes] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [view, setView] = useState("quizzes");
    const [activeQuizId, setActiveQuizId] = useState(null);
    const [activeStudyPath, setActiveStudyPath] = useState(null);
    const [generatingPath, setGeneratingPath] = useState(null);
    const [meetings, setMeetings] = useState([]);
    const refreshMeetings = useCallback(async () => {
        try {
            const res = await fetchMeetings();
            setMeetings(res.data);
        } catch (error) {
            console.error("Failed to fetch meetings", error);
        }
    }, []);

    const loadNotes = useCallback(async () => {
        try {
            const res = await fetchNotes();
            setNotes(res.data.sort((a, b) => b.id - a.id));
        } catch (err) {
            console.error("Failed to fetch notes", err);
        }
    }, []);

    const loadQuizzes = useCallback(async () => {
        try {
            const res = await fetchQuizzes();
            setQuizzes(res.data.sort((a, b) => b.id - a.id));
        } catch (err) {
            console.error("Failed to fetch quizzes", err);
        }
    }, []);

    useEffect(() => {
        const loadDashboardData = async () => {
            await Promise.all([loadNotes(), loadQuizzes(), refreshMeetings()]);
        };

        void loadDashboardData();
    }, [loadNotes, loadQuizzes, refreshMeetings]);

    useEffect(() => {
        const id = setInterval(async () => {
            await refreshMeetings();
        }, 15000);
        return () => clearInterval(id);
    }, [refreshMeetings]);
    const handleLogout = async () => {
        try {
            await logoutUser();
            localStorage.removeItem('access_token');
            window.location.href = "/login";
        } catch {
            localStorage.removeItem('access_token');
            window.location.href = "/login";
        }
    };

    const handleStartQuiz = (id) => {
        toast.loading('Loading quiz...', { id: 'load-quiz' });
        setActiveQuizId(id);
        setTimeout(() => toast.dismiss('load-quiz'), 800);
    };

    const handleFinishQuiz = () => {
        setActiveQuizId(null);
        setView("quizzes");
        loadQuizzes();
    };

    const handleViewStudyPath = async (noteId) => {
        try {
            const res = await fetchStudyPath(noteId);
            setActiveStudyPath(res.data);
        } catch {
            // If it fails, maybe it hasn't been generated yet. Let's try to generate it.
            await handleGenerateStudyPath(noteId, true);
        }
    };

    const handleGenerateStudyPath = async (noteId, viewAfter = false) => {
        setGeneratingPath(noteId);
        const promise = generateStudyPath(noteId);

        toast.promise(promise, {
            loading: 'Generating AI Study Path...',
            success: (res) => {
                void loadNotes();
                if (viewAfter) {
                    setActiveStudyPath(res.data);
                }
                return 'AI Study Path is ready!';
            },
            error: 'Failed to generate Study Path. Please try again.',
        });
        try {
            await promise;
        } finally {
            setGeneratingPath(null);
        }
    };

    const inlinePdfUrl = (url) => {
        try {
            if (!url) return url;
            if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
                if (url.includes('/upload/fl_inline/')) return url;
                return url.replace('/upload/', '/upload/fl_inline/');
            }
            return url;
        } catch {
            return url;
        }
    };

    if (activeQuizId) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="dashboard-container"
                style={{ display: 'block', background: '#fff' }}
            >
                <div style={{ padding: '40px' }}>
                    <QuizAttempt quizId={activeQuizId} onFinish={handleFinishQuiz} />
                </div>
            </motion.div>
        );
    }

    return (
        <div className="dashboard-container">
            <aside className="sidebar">
                <div className="sidebar-logo">Orion-X</div>
                <nav className="sidebar-nav">
                    <motion.div
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={`sidebar-item ${view === 'notes' ? 'active' : ''}`}
                        onClick={() => setView("notes")}
                    >
                        <Library size={20} />
                        <span>Student Library</span>
                    </motion.div>
                    <motion.div
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={`sidebar-item ${view === 'quizzes' ? 'active' : ''}`}
                        onClick={() => setView("quizzes")}
                    >
                        <FileQuestion size={20} />
                        <span>My Quizzes</span>
                    </motion.div>
                    <motion.div
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={`sidebar-item ${view === 'meetings' ? 'active' : ''}`}
                        onClick={() => setView("meetings")}
                    >
                        <MessageSquare size={20} />
                        <span>Video Meetings</span>
                    </motion.div>
                    <motion.div
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={`sidebar-item ${view === 'tutor' ? 'active' : ''}`}
                        onClick={() => setView("tutor")}
                    >
                        <MessageSquare size={20} />
                        <span>AI Tutor</span>
                    </motion.div>
                </nav>
                <div className="sidebar-footer">
                    <motion.button
                        whileHover={{ backgroundColor: "#fef2f2" }}
                        whileTap={{ scale: 0.95 }}
                        className="logout-btn"
                        onClick={handleLogout}
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </motion.button>
                </div>
            </aside>

            <main className="main-content">
                <header className="content-header">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {view === 'notes'
                            ? 'Student Library'
                            : view === 'quizzes'
                                ? 'Available Quizzes'
                                : view === 'meetings'
                                    ? 'Video Meetings'
                                    : 'AI Tutor'}
                    </motion.h1>
                </header>

                <AnimatePresence mode="wait">
                    {activeStudyPath ? (
                        <motion.div
                            key="study-path-view"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <StudyPathViewer
                                studyPath={activeStudyPath}
                                onClose={() => setActiveStudyPath(null)}
                            />
                        </motion.div>
                    ) : view === 'notes' ? (
                        <motion.section
                            key="notes-grid"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="section-card"
                        >
                            <h2 className="section-title"><Library size={22} /> Notes from your Teachers</h2>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
                                {notes.length === 0 ? (
                                    <p style={{ color: '#64748b', textAlign: 'center', gridColumn: '1/-1', padding: '40px' }}>No notes available yet.</p>
                                ) : (
                                    notes.map((n, idx) => (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                            key={n.id}
                                            className="note-card"
                                        >
                                            <h3 className="note-card-title">{n.title}</h3>
                                            <p className="note-card-content">{n.content.substring(0, 100)}...</p>

                                            <div className="note-card-footer">
                                                {n.has_study_path ? (
                                                    <motion.button
                                                        whileHover={{ scale: 1.02, background: '#0f172a', color: '#fff' }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => handleViewStudyPath(n.id)}
                                                        className="note-action-button primary"
                                                    >
                                                        <Compass size={16} /> View Study Path
                                                    </motion.button>
                                                ) : (
                                                    <motion.button
                                                        whileHover={{ scale: 1.02, background: '#0f172a', color: '#fff' }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => handleGenerateStudyPath(n.id)}
                                                        disabled={generatingPath === n.id}
                                                        className="note-action-button primary"
                                                    >
                                                        {generatingPath === n.id ? <Loader size={16} className="animate-spin" /> : <Compass size={16} />}
                                                        {generatingPath === n.id ? "Generating..." : "Generate AI Study Path"}
                                                    </motion.button>
                                                )}
                                                {n.file_url && (
                                                    <motion.a
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        href={inlinePdfUrl(n.file_url)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="note-action-button"
                                                    >
                                                        <Download size={16} /> View PDF Note
                                                    </motion.a>
                                                )}

                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.section>
                    ) : view === 'quizzes' ? (
                        <motion.section
                            key="quizzes-grid"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="section-card"
                        >
                            <h2 className="section-title"><FileQuestion size={22} color="#059669" /> Published Quizzes</h2>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
                                {quizzes.length === 0 ? (
                                    <p style={{ color: '#64748b', textAlign: 'center', gridColumn: '1/-1', padding: '40px' }}>No quizzes available for you yet.</p>
                                ) : (
                                    quizzes.map((q, idx) => (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                            key={q.id}
                                            className="note-card"
                                        >
                                            <h3 className="note-card-title">{q.title}</h3>
                                            <p className="note-card-content">{q.description}</p>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
                                                    <Clock size={14} />
                                                    <span>{q.timer_minutes}m</span>
                                                </div>
                                                <motion.button
                                                    type="button"
                                                    whileHover={{ scale: 1.05, backgroundColor: '#0f172a' }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="auth-btn"
                                                    onClick={() => handleStartQuiz(q.id)}
                                                    style={{
                                                        width: 'auto',
                                                        padding: '0 20px',
                                                        height: '40px',
                                                        fontSize: '14px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        borderRadius: '12px'
                                                    }}
                                                >
                                                    <PlayCircle size={18} /> Start Quiz
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.section>
                    ) : (
                        view === 'meetings' ? (
                            <motion.section
                                key="meetings-grid"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="section-card"
                            >
                                <h2 className="section-title">Live Video Meetings</h2>
                                {meetings.filter(m => m.status === 'live').length === 0 ? (
                                    <p className="text-gray-500">No live meetings right now.</p>
                                ) : (
                                    <div style={{ display: 'grid', gap: '12px' }}>
                                        {meetings.filter(m => m.status === 'live').map(m => (
                                            <div key={m.id} className="note-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div>
                                                    <div className="note-card-title" style={{ marginBottom: 4 }}>Room: {m.room_name}</div>
                                                    <div className="note-card-content">Hosted by teacher • Live</div>
                                                </div>
                                                <motion.a
                                                    whileHover={{ scale: 1.05, backgroundColor: '#0f172a' }}
                                                    whileTap={{ scale: 0.95 }}
                                                    href={`${m.url}#config.startWithAudioMuted=true&config.startWithVideoMuted=true`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="auth-btn"
                                                    style={{ width: 'auto', padding: '0 20px' }}
                                                >
                                                    Join Meeting
                                                </motion.a>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.section>
                        ) : (
                            <motion.section
                                key="tutor-tab"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="section-card"
                            >
                                <h2 className="section-title">AI Tutor</h2>
                                <div className="tutor-tab-section">
                                    <TutorChat onClose={() => setView('quizzes')} />
                                </div>
                            </motion.section>
                        )
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default StudentDashboard;
