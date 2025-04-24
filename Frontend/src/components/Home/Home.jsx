import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../../assets/images/logo.png';
import { FiLogOut, FiUpload, FiCheck, FiFileText, FiUser, FiClock, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('upload');
    const [uploadingFile, setUploadingFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [userData, setUserData] = useState(null);
    const [atsScore, setAtsScore] = useState(null);
    const [atsFeedback, setAtsFeedback] = useState('');
    const [checksRemaining, setChecksRemaining] = useState(2);
    const [jobDescription] = useState('Software developers');
    const [isLoading, setIsLoading] = useState(false);
    const [currentResume, setCurrentResume] = useState(null);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadMessage, setUploadMessage] = useState('');
    const [username, setUsername] = useState('');
    const [atsHistory, setAtsHistory] = useState([]);
    const [expandedFeedbacks, setExpandedFeedbacks] = useState({});

    useEffect(() => {
        const checkUserStatus = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/');
                    return;
                }

                // Get username from token
                try {
                    const tokenParts = token.split('.');
                    if (tokenParts.length === 3) {
                        const payload = JSON.parse(atob(tokenParts[1]));
                        if (payload.username) {
                            setUsername(payload.username);
                        }
                    }
                } catch (error) {
                    console.error('Error decoding token:', error);
                }

                // Get user data and remaining ATS checks
                const response = await axios.get('http://localhost:5000/resume/ats-checks', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                setChecksRemaining(response.data.checksRemaining);
                
                // Check if the user has already submitted a final resume
                if (response.data.hasSubmitted) {
                    setHasSubmitted(true);
                    alert('You have already submitted your final resume. You can no longer make changes.');
                    // Optionally, you can redirect or disable functionality
                    // navigate('/');
                }
                
                // Check if user has a resume
                try {
                    const resumeResponse = await axios.get('http://localhost:5000/resume/current', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (resumeResponse.data.cloudinaryUrl) {
                        setCurrentResume(resumeResponse.data.cloudinaryUrl);
                    }
                } catch (error) {
                    console.log('No resume found or error fetching resume');
                }

                // Get ATS check history
                try {
                    const historyResponse = await axios.get('http://localhost:5000/resume/ats-history', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (historyResponse.data.atsCheckHistory) {
                        setAtsHistory(historyResponse.data.atsCheckHistory);
                    }
                } catch (error) {
                    console.log('Error fetching ATS check history:', error);
                }
                
            } catch (error) {
                console.error('Failed to fetch user data:', error);
                if (error.response?.status === 401) {
                    handleLogout();
                }
            }
        };

        checkUserStatus();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
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
        if (files.length > 0) {
            handleResumeUpload(files[0]);
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            handleResumeUpload(files[0]);
        }
    };
    
    // Handle regular resume upload (not ATS check)
    const handleResumeUpload = async (file) => {
        if (file.type !== 'application/pdf') {
            alert('Please upload a PDF file only');
            return;
        }

        setUploadingFile(file);
        setUploadProgress(0);
        setUploadSuccess(false);
        setUploadMessage('');

            const formData = new FormData();
        formData.append('resume', file);

            try {
            const response = await axios.post('http://localhost:5000/resume/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    onUploadProgress: (progressEvent) => {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(progress);
                }
            });

            setUploadingFile(null);
            setUploadProgress(0);
            setUploadSuccess(true);
            setUploadMessage('Resume uploaded successfully!');
            setCurrentResume(response.data.cloudinaryUrl);
            
            // Wait 3 seconds and clear the success message
            setTimeout(() => {
                setUploadSuccess(false);
                setUploadMessage('');
            }, 3000);
            
        } catch (error) {
            console.error('Upload failed:', error);
            setUploadingFile(null);
            setUploadProgress(0);
            
            if (error.response?.status === 401) {
                handleLogout();
            } else {
                alert(`Failed to upload resume: ${error.response?.data?.error || 'Unknown error'}`);
            }
        }
    };

    // Handle ATS check
    const handleATSCheck = async () => {
        if (!currentResume) {
            alert('Please upload a resume first before checking ATS score');
            setActiveTab('upload');
            return;
        }
        
        // Don't check checksRemaining here; let the backend handle it
        // This way we can show results for the last check

        setIsLoading(true);
        setAtsScore(null);
        setAtsFeedback('');

        try {
            // Using the new dedicated ATS check endpoint
            const response = await axios.post(
                'http://localhost:5000/resume/ats-check', 
                { jobDescription },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            setIsLoading(false);
            
            if (response.data) {
                setAtsScore(response.data.atsScore);
                setAtsFeedback(response.data.atsFeedback);
                setChecksRemaining(response.data.checksRemaining);

                // Refresh ATS history after a new check
                refreshAtsHistory();
            }
        } catch (error) {
            console.error('ATS check failed:', error);
            setIsLoading(false);
            
            if (error.response?.status === 401) {
                handleLogout();
            } else if (error.response?.status === 403) {
                alert('You have used all your available ATS checks');
            } else if (error.response?.status === 400 && error.response.data?.error === 'Same resume detected') {
                alert('Please upload a different or improved resume before using your final ATS check. The system has detected that you are trying to check the same resume again.');
                setActiveTab('upload');
            } else if (error.response?.status === 404 || error.response?.status === 400) {
                alert('Error: Resume not found or invalid. Please upload a valid resume first.');
                setActiveTab('upload');
            } else {
                alert(`Failed to check ATS score: ${error.response?.data?.error || 'Unknown error'}`);
            }
        }
    };

    // Get ATS check history
    const refreshAtsHistory = async () => {
        try {
            const response = await axios.get('http://localhost:5000/resume/ats-history', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.data.atsCheckHistory) {
                setAtsHistory(response.data.atsCheckHistory);
            }
        } catch (error) {
            console.error('Failed to fetch ATS history:', error);
        }
    };

    // Format date for history display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    // Handle final submission
    const handleFinalSubmit = async () => {
        if (!currentResume) {
            alert('Please upload a resume first before final submission');
            setActiveTab('upload');
            return;
        }
        
        const confirmSubmit = window.confirm(
            'Are you sure you want to submit your resume? After submission, you will not be able to make any changes.'
        );
        
        if (!confirmSubmit) {
            return;
        }
        
        setIsLoading(true);

        try {
            const response = await axios.post(
                'http://localhost:5000/resume/final-submit',
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            setIsLoading(false);
            setHasSubmitted(true);
            alert('Your resume has been successfully submitted!');
            
        } catch (error) {
            console.error('Final submission failed:', error);
            setIsLoading(false);
            
            if (error.response?.status === 401) {
                handleLogout();
            } else {
                alert(`Failed to submit resume: ${error.response?.data?.error || 'Unknown error'}`);
            }
        }
    };

    // Toggle expanded feedback
    const toggleFeedback = (index) => {
        setExpandedFeedbacks(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <div className="logo-container">
                    <img src={logo} alt="Perfect CV" className="logo" />
                    <h1 className="app-title">Perfect CV</h1>
                </div>
                <div className="user-controls">
                    {username && (
                        <div className="user-info">
                            <FiUser /> <span className="username">{username}</span>
                        </div>
                    )}
                    <button onClick={handleLogout} className="logout-button">
                        <FiLogOut /> <span>Logout</span>
                    </button>
                </div>
            </header>
            
            <div className="app-content">
                <nav className="app-navigation">
                    <button 
                        className={`nav-item ${activeTab === 'upload' ? 'active' : ''}`}
                        onClick={() => setActiveTab('upload')}
                        disabled={hasSubmitted}
                    >
                        <FiUpload /> <span>Upload Resume</span>
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'ats' ? 'active' : ''}`}
                        onClick={() => setActiveTab('ats')}
                        disabled={!currentResume || hasSubmitted}
                    >
                        <FiFileText /> <span>ATS Check</span>
                        {checksRemaining > 0 && (
                            <span className="badge">{checksRemaining}</span>
                        )}
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                        disabled={!currentResume || hasSubmitted || atsHistory.length === 0}
                    >
                        <FiClock /> <span>Check History</span>
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'submit' ? 'active' : ''}`}
                        onClick={() => setActiveTab('submit')}
                        disabled={!currentResume || hasSubmitted}
                    >
                        <FiCheck /> <span>Final Submission</span>
                    </button>
                </nav>

                <main className="app-main">
                    {activeTab === 'upload' && (
                        <div className="section-container">
                            <div className="section-header">
                                <h2>Upload Resume</h2>
                                {currentResume && (
                                    <div className="current-resume-info">
                                        <p>Current resume: <a href={currentResume} target="_blank" rel="noopener noreferrer">View</a></p>
                                    </div>
                                )}
                            </div>
                            
                            {hasSubmitted ? (
                                <div className="info-panel">
                                    <p>You have already submitted your final resume. You cannot make any changes now.</p>
                                </div>
                            ) : (
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
                                    <p className="file-info">Supported format: PDF only</p>
                                </div>
                            )}
                            
                            {uploadingFile && (
                                <div className="progress-container">
                                    <p className="file-name">{uploadingFile.name}</p>
                                    <div className="progress-bar">
                                        <div className="progress" style={{ width: `${uploadProgress}%` }}></div>
                                    </div>
                                    <p className="progress-text">{uploadProgress}%</p>
                                </div>
                            )}
                            
                            {uploadSuccess && (
                                <div className="success-message">
                                    <p>{uploadMessage}</p>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {activeTab === 'ats' && (
                        <div className="section-container">
                            <div className="section-header">
                                <h2>ATS Compatibility Check</h2>
                                <div className="checks-info">
                                    <p>Remaining checks: <span className="checks-count">{checksRemaining}</span></p>
                                </div>
                            </div>
                            
                            {!currentResume ? (
                                <div className="info-panel">
                                    <p>Please upload a resume first before checking ATS score.</p>
                                    <button 
                                        className="action-button"
                                        onClick={() => setActiveTab('upload')}
                                    >
                                        Upload Resume
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="job-description-section">
                                        <h3>Job Description</h3>
                                        <textarea
                                            value={jobDescription}
                                            readOnly
                                            placeholder="Software developers"
                                            rows={3}
                                        />
                                    </div>
                                    
                                    <button 
                                        className="action-button"
                                        onClick={handleATSCheck}
                                        disabled={isLoading || checksRemaining <= 0}
                                    >
                                        {isLoading ? 'Analyzing...' : checksRemaining <= 0 ? 'No Checks Remaining' : 'Check ATS Score'}
                                    </button>
                                    
                                    {checksRemaining <= 0 && !isLoading && !atsScore && (
                                        <div className="info-panel">
                                            <p>You have used all your ATS checks. Please proceed to final submission or view your check history.</p>
                                            <div className="button-group">
                                                <button 
                                                    className="secondary-button"
                                                    onClick={() => setActiveTab('history')}
                                                    disabled={atsHistory.length === 0}
                                                >
                                                    View Check History
                                                </button>
                                                <button 
                                                    className="action-button"
                                                    onClick={() => setActiveTab('submit')}
                                                >
                                                    Go to Final Submission
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {isLoading && (
                                        <div className="loading-section">
                                            <div className="loader"></div>
                                            <p>Analyzing your resume...</p>
                                        </div>
                                    )}
                                    
                                    {atsScore !== null && (
                                        <div className="results-section">
                                            <div className="score-display">
                                                <h3>ATS Score</h3>
                                                <div className="score-circle">
                                                    <span>{atsScore}</span>
                                                </div>
                                                <p>out of 100</p>
                                            </div>
                                            
                                            <div className="feedback-container">
                                                <h3>Feedback</h3>
                                                <div className="feedback-content">
                                                    {atsFeedback.split('\n').map((line, index) => (
                                                        line.trim() ? (
                                                            <p key={index} dangerouslySetInnerHTML={{ 
                                                                __html: line.startsWith('•') 
                                                                    ? `<strong>${line}</strong>` 
                                                                    : line.startsWith('##') 
                                                                        ? `<strong>${line.replace('##', '')}</strong>` 
                                                                        : line 
                                                            }} />
                                                        ) : <br key={index} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="section-container">
                            <div className="section-header">
                                <h2>ATS Check History</h2>
                            </div>
                            
                            {atsHistory.length === 0 ? (
                                <div className="info-panel">
                                    <p>No ATS checks have been performed yet.</p>
                                    <button 
                                        className="action-button"
                                        onClick={() => setActiveTab('ats')}
                                    >
                                        Go to ATS Check
                                    </button>
                                </div>
                            ) : (
                                <div className="history-list">
                                    {atsHistory.slice().reverse().map((check, index) => (
                                        <div key={index} className="history-item">
                                            <div className="history-header">
                                                <div className="history-date">
                                                    <strong>Date:</strong> {formatDate(check.date)}
                                                </div>
                                                <div className="history-score">
                                                    <strong>Score:</strong> <span className="score">{check.combinedScore}</span>/100
                                                </div>
                                            </div>
                                            <div className="history-job">
                                                <strong>Job Description:</strong> {check.jobDescription}
                                            </div>
                                            <div className="history-feedback">
                                                <strong>Feedback:</strong>
                                                <div className={`feedback-preview ${expandedFeedbacks[index] ? 'expanded' : ''}`}>
                                                    {check.feedback && check.feedback.split('\n').map((line, i) => (
                                                        line.trim() ? (
                                                            <p key={i} dangerouslySetInnerHTML={{ 
                                                                __html: line.startsWith('•') 
                                                                    ? `<strong>${line}</strong>` 
                                                                    : line.startsWith('##') 
                                                                        ? `<strong>${line.replace('##', '')}</strong>` 
                                                                        : line 
                                                            }} />
                                                        ) : <br key={i} />
                                                    ))}
                                                </div>
                                                <button 
                                                    className="expand-button" 
                                                    onClick={() => toggleFeedback(index)}
                                                >
                                                    {expandedFeedbacks[index] ? 
                                                        <><FiChevronUp /> Show Less</> : 
                                                        <><FiChevronDown /> Show More</>
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {activeTab === 'submit' && (
                        <div className="section-container">
                            <div className="section-header">
                                <h2>Final Submission</h2>
                            </div>
                            
                            {hasSubmitted ? (
                                <div className="info-panel success">
                                    <p>Your resume has been successfully submitted!</p>
                                </div>
                            ) : !currentResume ? (
                                <div className="info-panel">
                                    <p>Please upload a resume first before final submission.</p>
                                    <button 
                                        className="action-button"
                                        onClick={() => setActiveTab('upload')}
                                    >
                                        Upload Resume
                                    </button>
                                </div>
                            ) : (
                                <div className="submission-section">
                                    <div className="warning-message">
                                        <p>Warning: Once you submit your resume, you will not be able to make any further changes or check ATS scores.</p>
                                    </div>
                                    
                                    {checksRemaining > 0 && (
                                        <div className="info-message">
                                            <p>You still have {checksRemaining} ATS checks remaining. Consider using them before final submission.</p>
                                            <button 
                                                className="secondary-button"
                                                onClick={() => setActiveTab('ats')}
                                            >
                                                Check ATS Score First
                                            </button>
                                        </div>
                                    )}
                                    
                                    <button 
                                        className="submit-button"
                                        onClick={handleFinalSubmit}
                                    >
                                        Submit Final Resume
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Home; 