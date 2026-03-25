import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/api";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Mail, Lock, User, GraduationCap, UserPlus, Sparkles } from "lucide-react";

void motion;

const Register = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("student");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await registerUser({ email: email.trim(), password, role });
            toast.success("Account created successfully! Please sign in.");
            navigate("/login");
        } catch (err) {
            if (!err.response) {
                toast.error("Cannot reach the backend at http://127.0.0.1:8000. Start the backend server and try again.");
            } else {
                toast.error(err.response?.data?.detail || "Registration failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const MOTIVATION = [
        "Small steps each day lead to big understanding.",
        "Consistency beats intensity—study a little, learn a lot.",
        "Questions are the compass that leads to knowledge.",
        "Practice turns information into mastery.",
        "Progress, not perfection—keep moving forward.",
        "Your effort today is tomorrow’s advantage.",
        "Clarity comes from action—start, then refine.",
        "Learn something new; teach it to remember.",
        "Momentum matters—open the book and begin.",
        "Believe in the process; results will follow."
    ];
    const dayIndex = Math.floor(Date.now() / 86400000) % MOTIVATION.length;
    const motivation = MOTIVATION[dayIndex];

    return (
        <div className="auth-container">
            <motion.div
                className="auth-left"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
            >
                <div className="brand-box">
                    <motion.div
                        className="brand-icon-wrapper"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        <Sparkles size={48} className="brand-icon" />
                    </motion.div>
                    <h1 className="brand-title">Orion-X</h1>
                    <p className="brand-sub">{motivation}</p>
                    <div className="auth-features">
                        <div className="feature-item"><span>AI-Powered Study Paths</span></div>
                        <div className="feature-item"><span>Automated Quiz Generation</span></div>
                        <div className="feature-item"><span>Real-time Performance Analytics</span></div>
                    </div>
                </div>
            </motion.div>
            <div className="auth-right">
                <motion.div
                    className="auth-card"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                >
                    <div className="auth-header">
                        <h2>Create Your Account</h2>
                        <p>Join the Orion-X community and revolutionize your learning.</p>
                    </div>
                    <form onSubmit={handleRegister} className="auth-form">
                        <div className="input-group">
                            <label>Email Address</label>
                            <div className="input-wrapper">
                                <Mail size={18} className="input-icon" />
                                <input
                                    type="email"
                                    className="auth-input"
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="input-group">
                            <label>Password</label>
                            <div className="input-wrapper">
                                <Lock size={18} className="input-icon" />
                                <input
                                    type="password"
                                    className="auth-input"
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="input-group">
                            <label>I am a...</label>
                            <div className="auth-role">
                                <motion.div
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className={`role-pill ${role === "student" ? "active" : ""}`}
                                    onClick={() => setRole("student")}
                                >
                                    <User size={16} />
                                    <span>Student</span>
                                </motion.div>
                                <motion.div
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className={`role-pill ${role === "teacher" ? "active" : ""}`}
                                    onClick={() => setRole("teacher")}
                                >
                                    <GraduationCap size={16} />
                                    <span>Teacher</span>
                                </motion.div>
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            className="auth-btn"
                            disabled={loading}
                        >
                            {loading ? "Creating Account..." : "Get Started for Free"}
                            {!loading && <UserPlus size={18} />}
                        </motion.button>
                    </form>
                    <div className="auth-footer">
                        Already have an account? <Link to="/login">Sign in here</Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );

};

export default Register;
