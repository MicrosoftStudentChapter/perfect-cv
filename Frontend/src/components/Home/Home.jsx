import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../../assets/images/logo.png';
import { FiLogOut } from 'react-icons/fi';
import { FiUpload } from 'react-icons/fi';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();
    const [uploadingFiles, setUploadingFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('userEmail');
        navigate('/login');
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        handleFiles(files);
    };

    const handleFiles = async (files) => {
        const validFiles = files.filter(file => {
            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 
                              'application/pdf', 'application/psd', 'application/ai',
                              'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                              'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
            return validTypes.includes(file.type);
        });

        if (validFiles.length === 0) {
            alert('Please upload valid file formats');
            return;
        }

        setUploadingFiles(validFiles.map(file => ({
            name: file.name,
            progress: 0
        })));

        for (const file of validFiles) {
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await axios.post('http://localhost:5000/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    onUploadProgress: (progressEvent) => {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadingFiles(prev => prev.map(f => 
                            f.name === file.name ? { ...f, progress } : f
                        ));
                    }
                });

                if (response.data.success) {
                    setUploadingFiles(prev => prev.filter(f => f.name !== file.name));
                }
            } catch (error) {
                console.error('Upload failed:', error);
                alert(`Failed to upload ${file.name}`);
                setUploadingFiles(prev => prev.filter(f => f.name !== file.name));
            }
        }
    };

    return (
        <div className="home-container">
            <nav className="nav-bar">
                <div className="logo-section">
                    <img src={logo} alt="Microsoft Learn Student Ambassador" className="logo" />
                </div>
                <h1 className="site-title">
                    <span>Perfect</span>
                    <span>CV</span>
                </h1>
                <button onClick={handleLogout} className="logout-button">
                    <FiLogOut />
                </button>
            </nav>

            <div className="sidebar">
                <button className="nav-button active">HOME</button>
                <button className="nav-button" onClick={() => navigate('/leaderboard')}>Leaderboard</button>
            </div>

            <main className="main-content">
                <div className="upload-section">
                    <h2>Upload</h2>
                    <div 
                        className={`upload-area ${isDragging ? 'dragging' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <FiUpload className="upload-icon" />
                        <p>Drag & drop files or <label className="browse-label">Browse<input
                            type="file"
                            onChange={handleFileSelect}
                            multiple
                            accept=".jpg,.jpeg,.png,.gif,.mp4,.pdf,.psd,.ai,.doc,.docx,.ppt,.pptx"
                            style={{ display: 'none' }}
                        /></label></p>
                        <p className="file-types">Supported formats: JPEG, PNG, GIF, MP4, PDF, PSD, AI, Word, PPT</p>
                    </div>

                    {uploadingFiles.length > 0 && (
                        <div className="uploading-files">
                            {uploadingFiles.map((file, index) => (
                                <div key={index} className="upload-progress">
                                    <span>
                                        <div className="file-name">{file.name}</div>
                                        <div className="percentage">{file.progress}%</div>
                                    </span>
                                    <div className="progress-bar">
                                        <div 
                                            className="progress" 
                                            style={{ width: `${file.progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Home; 