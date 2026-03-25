import React, { useState, useEffect, useCallback } from "react";
import { fetchQuizDetails, submitQuiz } from "../services/api";
import toast from "react-hot-toast";

const QuizAttempt = ({ quizId, onFinish }) => {
    const [quiz, setQuiz] = useState(null);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [warningCount, setWarningCount] = useState(0);
    const [quizStarted, setQuizStarted] = useState(false);
    const [finished, setFinished] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    const handleFinish = useCallback(async () => {
        if (submitting) return;
        setSubmitting(true);

        const mappedAnswers = {};
        quiz.questions.forEach((q, idx) => {
            mappedAnswers[q.id] = answers[idx] || "";
        });

        try {
            const res = await submitQuiz({
                quiz_id: parseInt(quizId),
                answers: mappedAnswers
            });
            setResult(res.data);
            setFinished(true);
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
        } catch {
            toast.error("Failed to submit quiz results");
            setFinished(true);
        } finally {
            setSubmitting(false);
        }
    }, [submitting, quiz, answers, quizId]);

    const handleViolation = useCallback(() => {
        setWarningCount(prev => {
            const newCount = prev + 1;
            if (newCount >= 3) {
                toast.error(`Cheating detected: left the quiz ${newCount} times. Auto-submitting.`);
                handleFinish();
            } else {
                toast.error(`Warning (${newCount}/3): Do not leave the quiz tab or window.`);
            }
            return newCount;
        });
    }, [handleFinish]);

    const loadQuiz = useCallback(async () => {
        toast.loading("Preparing quiz...", { id: "load-quiz" });
        try {
            const res = await fetchQuizDetails(quizId);
            setQuiz(res.data);
            setTimeLeft(res.data.timer_minutes * 60);
        } catch {
            toast.error("Failed to load quiz", { id: "load-quiz" });
            onFinish();
            return;
        } finally {
            // no-op here; we'll finalize in success path too
        }
        toast.success("Quiz ready!", { id: "load-quiz" });
    }, [quizId, onFinish]);

    useEffect(() => {
        loadQuiz();
    }, [loadQuiz]);

    // Timer logic
    useEffect(() => {
        if (quizStarted && timeLeft > 0 && !finished) {
            const timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && quizStarted && !finished) {
            handleFinish();
        }
    }, [quizStarted, timeLeft, finished, handleFinish]);

    // Ethical constraints: Anti-cheat
    useEffect(() => {
        if (!quizStarted || finished) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                handleViolation("tab switch");
            }
        };

        const handleBlur = () => {
            // Check if we're in fullscreen before counting blur as violation
            if (!document.fullscreenElement) {
                handleViolation("window blur");
            }
        };

        window.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);

        return () => {
            window.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
        };
    }, [quizStarted, finished, handleViolation]);

    const enterFullScreen = useCallback(() => {
        const elem = document.documentElement;
        try {
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            }
        } catch (e) {
            console.warn("Fullscreen request failed", e);
        }
    }, []);

    const startQuiz = useCallback(() => {
        enterFullScreen();
        setQuizStarted(true);
    }, [enterFullScreen]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (!quiz) return <div>Loading quiz...</div>;

    if (!quizStarted) {
        return (
            <div className="section-card" style={{ textAlign: 'center', padding: '60px' }}>
                <h2 style={{ marginBottom: '20px' }}>{quiz.title}</h2>
                <p style={{ marginBottom: '30px', color: '#666' }}>
                    This is an ethical quiz. Once you start:<br />
                    1. You must remain in Fullscreen mode.<br />
                    2. Switching tabs or windows will be detected.<br />
                    3. You have <strong>{quiz.timer_minutes} minutes</strong> to complete.
                </p>
                <button className="auth-btn" onClick={startQuiz} style={{ width: 'auto', padding: '0 40px' }}>
                    I Understand, Start Quiz
                </button>
            </div>
        );
    }

    if (finished) {
        return (
            <div className="section-card" style={{ textAlign: 'center', padding: '60px' }}>
                <h2 style={{ color: '#059669' }}>Quiz Submitted!</h2>
                {result && (
                    <div style={{ marginTop: '24px', padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <p style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Your Score: {result.score.toFixed(1)}%</p>
                        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px' }}>
                            You got {Math.round((result.score / 100) * result.total_questions)} out of {result.total_questions} questions correct.
                        </p>
                    </div>
                )}
                <p style={{ marginTop: '20px' }}>Thank you for completing the quiz ethically.</p>
                <button className="auth-btn" onClick={onFinish} style={{ marginTop: '30px', width: 'auto', padding: '0 40px' }}>
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const currentQuestion = quiz.questions[currentQuestionIdx];

    return (
        <div className="quiz-attempt-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '18px' }}>Question {currentQuestionIdx + 1} of {quiz.questions.length}</span>
                <div style={{ padding: '8px 16px', background: timeLeft < 60 ? '#fee2e2' : '#f3f4f6', color: timeLeft < 60 ? '#ef4444' : '#000', borderRadius: '8px', fontWeight: '700' }}>
                    Time Remaining: {formatTime(timeLeft)}
                </div>
            </div>

            <div className="section-card">
                <p style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>{currentQuestion.text}</p>
                <div className="options-grid" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {['a', 'b', 'c', 'd'].map(opt => (
                        <div
                            key={opt}
                            onClick={() => setAnswers({ ...answers, [currentQuestionIdx]: opt })}
                            style={{
                                padding: '16px',
                                border: '1px solid #dbdbdb',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                background: answers[currentQuestionIdx] === opt ? '#111827' : '#fff',
                                color: answers[currentQuestionIdx] === opt ? '#fff' : '#000',
                                transition: 'all 0.2s'
                            }}
                        >
                            <span style={{ fontWeight: '700', marginRight: '12px' }}>{opt.toUpperCase()}</span>
                            {currentQuestion[`option_${opt}`]}
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                <button
                    className="auth-btn"
                    disabled={currentQuestionIdx === 0}
                    onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                    style={{ width: 'auto', padding: '0 32px', background: '#fff', color: '#000', border: '1px solid #dbdbdb' }}
                >
                    Previous
                </button>

                {currentQuestionIdx === quiz.questions.length - 1 ? (
                    <button className="auth-btn" onClick={handleFinish} disabled={submitting} style={{ width: 'auto', padding: '0 40px', background: '#059669' }}>
                        {submitting ? "Submitting..." : "Submit Quiz"}
                    </button>
                ) : (
                    <button className="auth-btn" onClick={() => setCurrentQuestionIdx(prev => prev + 1)} style={{ width: 'auto', padding: '0 40px' }}>
                        Next Question
                    </button>
                )}
            </div>

            <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '12px', color: '#9ca3af' }}>
                Ethical Monitoring Active • Warnings: {warningCount}/3
            </div>
        </div>
    );
};

export default QuizAttempt;
