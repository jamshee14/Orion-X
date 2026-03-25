import React, { useState } from "react";
import { postNote } from "../services/api";
import { UploadCloud, File as FileIcon, CheckCircle } from "lucide-react";

const CreateNote = ({ onNoteCreated, setUploading }) => {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [file, setFile] = useState(null);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !content) {
            setError("Title and content are required.");
            return;
        }
        setUploading(true);
        setError("");

        const formData = new FormData();
        formData.append("title", title);
        formData.append("content", content);
        if (file) {
            formData.append("file", file);
        }

        try {
            const res = await postNote(formData);
            setTitle("");
            setContent("");
            setFile(null);
            onNoteCreated(res.data); // Pass the new note back
        } catch {
            setError("Failed to create note. Please try again.");
            setUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="create-note-form">
            {error && <p className="error-message">{error}</p>}
            <div className="form-group">
                <label>Note Title</label>
                <input
                    className="auth-input"
                    placeholder="e.g., Quantum Mechanics Basics"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>
            <div className="form-group">
                <label>Content / Description</label>
                <textarea
                    className="auth-input"
                    placeholder="Write a brief description or the main content here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                />
            </div>
            <div className="form-group">
                <label>Upload PDF (Optional)</label>
                <div className="file-upload-area">
                    <input
                        type="file"
                        id="file-upload"
                        accept=".pdf"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="hidden-file-input"
                    />
                    <label htmlFor="file-upload" className="file-upload-label">
                        <UploadCloud size={24} />
                        <span>{file ? "Change file" : "Click to upload a PDF"}</span>
                    </label>
                    {file && (
                        <div className="file-selected-chip">
                            <FileIcon size={16} />
                            <span>{file.name}</span>
                            <CheckCircle size={18} className="text-green-600" />
                        </div>
                    )}
                </div>
            </div>
            <button type="submit" className="auth-btn" style={{ width: '100%' }}>
                Add Note
            </button>
        </form>
    );
};

export default CreateNote;
