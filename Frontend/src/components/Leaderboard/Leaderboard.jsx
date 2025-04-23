import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Leaderboard.css';
import logo from '../../assets/images/logo.png';
import { FiLogOut } from 'react-icons/fi';

const Leaderboard = () => {
    const navigate = useNavigate();
    const [sortBy, setSortBy] = useState('position');

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    // Sample data - replace with actual data from your backend
    const [leaderboardData, setLeaderboardData] = useState([
        { rank: 1, name: 'xxx yyy', atsScore: 10000, features: [], medal: 'gold' },
        { rank: 2, name: 'xxx yyy', atsScore: 10000, features: [], medal: 'silver' },
        { rank: 3, name: 'xxx yyy', atsScore: 10000, features: [], medal: 'bronze' },
        { rank: 4, name: 'xxx yyy', atsScore: 10000, features: [] },
        { rank: 5, name: 'xxx yyy', atsScore: 10000, features: [] },
    ]);

    const handleSort = (criteria) => {
        setSortBy(criteria);
        const sortedData = [...leaderboardData].sort((a, b) => {
            if (criteria === 'position') {
                return a.rank - b.rank;
            }
            // Add other sorting criteria as needed
            return 0;
        });
        setLeaderboardData(sortedData);
    };

    const getMedalIcon = (medal) => {
        if (medal === 'gold') {
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#FFD700" stroke="#C9B037" strokeWidth="1.5"/>
                    <path d="M7 12L11 16L17 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            );
        } else if (medal === 'silver') {
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#C0C0C0" stroke="#B4B4B4" strokeWidth="1.5"/>
                    <path d="M7 12L11 16L17 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            );
        } else if (medal === 'bronze') {
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#CD7F32" stroke="#A66A2B" strokeWidth="1.5"/>
                    <path d="M7 12L11 16L17 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            );
        }
        return null;
    };

    return (
        <div className="leaderboard-container">
            <nav className="nav-bar">
                <div className="logo-section">
                    <img src={logo} alt="Microsoft Learn Student Ambassador" className="logo" />
                </div>
                <h1 className="site-title">Leaderboard</h1>
                <button onClick={handleLogout} className="logout-button">
                    <FiLogOut />
                </button>
            </nav>

            <main className="leaderboard-content">
                <div className="sort-section">
                    <div className="sort-dropdown">
                        Sort By: Position
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                </div>

                <div className="leaderboard-table">
                    <div className="table-header">
                        <div className="header-cell">Rank</div>
                        <div className="header-cell">Name</div>
                        <div className="header-cell">ATS Score</div>
                        <div className="header-cell">Features</div>
                    </div>
                    
                    {leaderboardData.map((item) => (
                        <div key={item.rank} className="table-row">
                            <div className="cell rank-cell">
                                {getMedalIcon(item.medal)} {item.rank}
                            </div>
                            <div className="cell name-cell">{item.name}</div>
                            <div className="cell score-cell">{item.atsScore.toLocaleString()}</div>
                            <div className="cell features-cell"></div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Leaderboard; 