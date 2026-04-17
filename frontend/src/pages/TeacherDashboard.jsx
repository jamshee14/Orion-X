import React, { useEffect, useState, useCallback } from "react";
import toast from 'react-hot-toast';
import { fetchNotes, fetchQuizzes, logoutUser, deleteNote, deleteQuiz, startMeeting, fetchMeetings, endMeeting } from "../services/api";
import CreateNote from "../components/CreateNote";
import QuizGenerator from "../components/QuizGenerator";
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    FileText,
    LogOut,
    PlusCircle,
    CheckCircle2,
    Clock,
    ExternalLink,
    BarChart3,
    Trash2,
    Loader,
    ArrowLeft
} from "lucide-react";

void motion;

const TeacherDashboard = () => {
    const [notes, setNotes] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [view, setView] = useState("notes");
    const [activeAnalyticsId, setActiveAnalyticsId] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [newNoteId, setNewNoteId] = useState(null);
    const [deletingQuiz, setDeletingQuiz] = useState(null);
    const [meetings, setMeetings] = useState([]);
    const [startingMeet, setStartingMeet] = useState(false);

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
            setNotes(res.data.sort((a, b) => b.id - a.id)); // Show newest first
        } catch (err) {
            console.error("Failed to fetch notes", err);
            toast.error("Failed to fetch notes.");
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

    const handleDeleteNote = async (noteId) => {
        if (!window.confirm("Are you sure you want to delete this note and all its related quizzes and data?")) return;

        setDeleting(noteId);
        const promise = deleteNote(noteId);
        toast.promise(promise, {
            loading: 'Deleting note...',
            success: () => {
                void loadNotes();
                void loadQuizzes();
                return 'Note deleted successfully.';
            },
            error: 'Failed to delete note.',
        });
        try {
            await promise;
        } finally {
            setDeleting(null);
        }
    };

    const handleStartMeeting = async () => {
        setStartingMeet(true);
        try {
            const res = await startMeeting();
            setMeetings([res.data, ...meetings]);
            toast.success("Meeting started. Share the link with students.");
            const teacherUrl = `${res.data.url}#config.startWithAudioMuted=false&config.startWithVideoMuted=false`;
            window.open(teacherUrl, "_blank", "noopener");
        } catch {
            toast.error("Failed to start meeting.");
        } finally {
            setStartingMeet(false);
        }
    };

    const handleEndMeeting = async (id) => {
        try {
            await endMeeting(id);
            setMeetings(ms => ms.map(m => m.id === id ? { ...m, status: 'ended' } : m));
            toast.success("Meeting ended.");
        } catch {
            toast.error("Failed to end meeting.");
        }
    };
    const handleDeleteQuiz = async (quizId) => {
        if (!window.confirm("Delete this quiz and all related attempts?")) return;
        setDeletingQuiz(quizId);
        const promise = deleteQuiz(quizId);
        toast.promise(promise, {
            loading: 'Deleting quiz...',
            success: () => {
                void loadQuizzes();
                return 'Quiz deleted successfully.';
            },
            error: 'Failed to delete quiz.',
        });
        try {
            await promise;
        } finally {
            setDeletingQuiz(null);
        }
    };
    const handleNoteCreated = (createdNote) => {
        setUploading(false);
        loadNotes().then(() => {
            setNewNoteId(createdNote.id);
            setTimeout(() => setNewNoteId(null), 2000); // Highlight for 2 seconds
        });
    };

    if (activeAnalyticsId) {
        return (
            <div className="dashboard-container">
                <aside className="sidebar">
                    <div className="sidebar-logo">Orion-X</div>
                    <nav className="sidebar-nav">
                        <motion.div
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            className={`sidebar-item`}
                            onClick={() => setActiveAnalyticsId(null)}
                        >
                            <ArrowLeft size={20} />
                            <span>Back to Quizzes</span>
                        </motion.div>
                    </nav>
                </aside>
                <main className="main-content">
                    <AnalyticsDashboard
                        quizId={activeAnalyticsId}
                        onClose={() => setActiveAnalyticsId(null)}
                    />
                </main>
            </div>
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
                        <BookOpen size={20} />
                        <span>Manage Notes</span>
                    </motion.div>
                    <motion.div
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={`sidebar-item ${view === 'quiz' ? 'active' : ''}`}
                        onClick={() => setView("quiz")}
                    >
                        <FileText size={20} />
                        <span>Manage Quizzes</span>
                    </motion.div>
                    <motion.div
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={`sidebar-item ${view === 'meetings' ? 'active' : ''}`}
                        onClick={() => setView("meetings")}
                    >
                        <ExternalLink size={20} />
                        <span>Video Meetings</span>
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
                        transition={{ duration: 0.5 }}
                    >
                        {view === 'notes' ? 'Upload & Manage Notes' : view === 'quiz' ? 'Generate & Manage Quizzes' : 'Live Video Meetings'}
                    </motion.h1>
                    {view === 'meetings' && (
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                            <motion.button
                                whileHover={{ backgroundColor: "#0f172a", color: "#fff" }}
                                whileTap={{ scale: 0.98 }}
                                className="auth-btn"
                                onClick={handleStartMeeting}
                                disabled={startingMeet}
                                style={{ width: 'auto', padding: '0 20px' }}
                            >
                                {startingMeet ? <Loader className="animate-spin" size={16} /> : <ExternalLink size={16} />}
                                {startingMeet ? 'Starting…' : 'Start Video Meeting'}
                            </motion.button>
                        </div>
                    )}
                </header>

                <AnimatePresence mode="wait">
                    {view === 'notes' ? (
                        <motion.div
                            key="notes-view"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="dashboard-sections"
                        >
                            <section className="section-card">
                                <h2 className="section-title"><PlusCircle size={22} /> Add New Note</h2>
                                <CreateNote onNoteCreated={handleNoteCreated} setUploading={setUploading} />
                            </section>

                            <section className="section-card">
                                <h2 className="section-title flex items-center gap-2">
                                    <BookOpen size={22} /> Your Uploaded Notes
                                    {uploading && <Loader className="animate-spin" size={20} />}
                                </h2>
                                <div className="notes-list" style={{ display: 'grid', gap: '16px' }}>
                                    {notes.length === 0 ? (
                                        <p className="text-center p-10 text-gray-500">No notes uploaded yet.</p>
                                    ) : (
                                        notes.map((n, idx) => (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                key={n.id}
                                                className={`note-item ${newNoteId === n.id ? 'new-note-highlight' : ''}`}
                                            >
                                                <div>
                                                    <span className="font-bold text-lg text-gray-800 block mb-1">{n.title}</span>
                                                </div>
                                                <div className="flex items-center gap-3">

                                                    {n.file_url && (
                                                        <motion.a
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            href={n.file_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="action-button-secondary"
                                                        >
                                                            <ExternalLink size={16} />
                                                            View PDF
                                                        </motion.a>
                                                    )}
                                                    <motion.button
                                                        whileHover={{ scale: 1.05, background: '#fee2e2', color: '#ef4444' }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleDeleteNote(n.id)}
                                                        disabled={deleting === n.id}
                                                        className="delete-button"
                                                    >
                                                        {deleting === n.id ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                    </motion.button>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </section>
                        </motion.div>
                    ) : view === 'quiz' ? (
                        <motion.div
                            key="quiz-view"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="dashboard-sections"
                        >
                            <section className="section-card">
                                <h2 className="section-title">Generate AI Quiz 🤖</h2>
                                <QuizGenerator notes={notes} onQuizCreated={loadQuizzes} />
                            </section>

                            <section className="section-card">
                                <h2 className="section-title"><CheckCircle2 size={22} color="#059669" /> Published Quizzes</h2>
                                <div className="quizzes-list" style={{ display: 'grid', gap: '16px' }}>
                                    {quizzes.length === 0 ? (
                                        <p className="text-center p-10 text-gray-500">No quizzes published yet.</p>
                                    ) : (
                                        quizzes.map((q, idx) => (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                key={q.id}
                                                className="note-item"
                                            >
                                                <div>
                                                    <span className="font-bold text-lg text-gray-800 block">{q.title}</span>
                                                    <div className="flex items-center gap-2 mt-2 text-gray-500 text-sm">
                                                        <Clock size={14} />
                                                        <span>{q.timer_minutes} mins</span>
                                                        <span className="mx-1">•</span>
                                                        <span className="active-chip">Active</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                <motion.button
                                                    whileHover={{ scale: 1.05, background: '#3b82f6', color: '#fff' }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => setActiveAnalyticsId(q.id)}
                                                    className="action-button-primary"
                                                >
                                                    <BarChart3 size={16} />
                                                    View Analytics
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.05, background: '#fee2e2', color: '#ef4444' }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleDeleteQuiz(q.id)}
                                                    disabled={deletingQuiz === q.id}
                                                    className="delete-button"
                                                >
                                                    {deletingQuiz === q.id ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                    Delete
                                                </motion.button>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </section>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="meetings-view"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="dashboard-sections"
                        >
                            <section className="section-card">
                                <h2 className="section-title">Live Meetings</h2>
                                {meetings.filter(m => m.status === 'live').length === 0 ? (
                                    <p className="text-gray-500">No live meetings.</p>
                                ) : (
                                    meetings.filter(m => m.status === 'live').map(m => (
                                        <div key={m.id} className="note-item">
                                            <div>
                                                <span className="font-bold text-lg">Room: {m.room_name}</span>
                                                <div className="text-sm text-gray-500">Started</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <motion.a
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    href={m.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="action-button-secondary"
                                                >
                                                    <ExternalLink size={16} /> Join
                                                </motion.a>
                                                <motion.button
                                                    whileHover={{ scale: 1.05, background: '#fee2e2', color: '#ef4444' }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleEndMeeting(m.id)}
                                                    className="delete-button"
                                                >
                                                    End
                                                </motion.button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </section>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default TeacherDashboard;
