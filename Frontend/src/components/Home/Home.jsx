import React, { useState, useEffect } from 'react';
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
    const [userData, setUserData] = useState(null);
    const [atsScore, setAtsScore] = useState(null);
    const [atsFeedback, setAtsFeedback] = useState('');
    const [checksRemaining, setChecksRemaining] = useState(2);
    const [jobDescription, setJobDescription] = useState('Software developers');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Get user's remaining ATS checks
        const fetchRemainingChecks = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/');
                    return;
                }

                const response = await axios.get('http://localhost:5000/resume/ats-checks', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                setChecksRemaining(response.data.checksRemaining);
            } catch (error) {
                console.error('Failed to fetch remaining checks:', error);
                if (error.response?.status === 401) {
                    handleLogout();
                }
            }
        };

        fetchRemainingChecks();
    }, [navigate]);

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

    const handleJobDescriptionChange = (e) => {
        setJobDescription(e.target.value);
    };

    const handleFiles = async (files) => {
        const validFiles = files.filter(file => {
            return file.type === 'application/pdf';
        });

        if (validFiles.length === 0) {
            alert('Please upload PDF files only');
            return;
        }

        // Only process the first file
        const file = validFiles[0];
        
        setUploadingFiles([{
            name: file.name,
            progress: 0
        }]);

        setIsLoading(true);
        setAtsScore(null);
        setAtsFeedback('');

        const formData = new FormData();
        formData.append('resume', file);
        formData.append('jobDescription', jobDescription);

        try {
            const response = await axios.post('http://localhost:5000/resume/upload?atsCheck=true', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadingFiles([{ name: file.name, progress }]);
                }
            });

            setUploadingFiles([]);
            setIsLoading(false);
            
            if (response.data) {
                setAtsScore(response.data.atsScore);
                setAtsFeedback(response.data.atsFeedback);
                setChecksRemaining(response.data.checksRemaining);
            }
        } catch (error) {
            console.error('Upload failed:', error);
            setIsLoading(false);
            setUploadingFiles([]);
            
            if (error.response?.status === 401) {
                handleLogout();
            } else if (error.response?.status === 403) {
                alert('You have used all your available ATS checks');
            } else if (error.response?.data?.error) {
                alert(error.response.data.error);
            } else {
                alert(`Failed to upload ${file.name}`);
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
                <div className="ats-info-section">
                    <h2>ATS Checker</h2>
                    <p>Remaining checks: <strong>{checksRemaining}</strong></p>
                    <p>Upload your resume to check its ATS compatibility score.</p>
                </div>

                <div className="job-description-section">
                    <h3>Job Description</h3>
                    <textarea
                        value={jobDescription}
                        onChange={handleJobDescriptionChange}
                        placeholder="Enter job description here (default: Software developers)"
                        rows={3}
                    />
                </div>

                <div className="upload-section">
                    <h2>Upload Resume</h2>
                    <div 
                        className={`upload-area ${isDragging ? 'dragging' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <FiUpload className="upload-icon" />
                        <p>Drag & drop your resume or <label className="browse-label">Browse<input
                            type="file"
                            onChange={handleFileSelect}
                            accept=".pdf"
                            style={{ display: 'none' }}
                        /></label></p>
                        <p className="file-types">Supported format: PDF</p>
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

                {isLoading && (
                    <div className="loading-section">
                        <p>Analyzing your resume...</p>
                    </div>
                )}

                {atsScore !== null && (
                    <div className="results-section">
                        <h2>ATS Score: {atsScore}/100</h2>
                        <div className="feedback-container">
                            <h3>Feedback</h3>
                            <div className="feedback-content">
                                {atsFeedback.split('\n').map((line, index) => (
                                    line.trim() ? (
                                        <p key={index} dangerouslySetInnerHTML={{ __html: line.startsWith('•') ? line : line.startsWith('##') ? `<strong>${line.replace('##', '')}</strong>` : line }} />
                                    ) : <br key={index} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Home; 