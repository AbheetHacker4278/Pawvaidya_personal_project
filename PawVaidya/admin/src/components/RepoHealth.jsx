import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Github, Star, GitFork, AlertCircle, Eye, Activity, Code2, ExternalLink, Calendar, GitCommit, User, Clock } from 'lucide-react';

const RepoHealth = ({ repoPath = 'AbheetHacker4278/Pawvaidya_personal_project' }) => {
    const [repoData, setRepoData] = useState(null);
    const [healthData, setHealthData] = useState(null);
    const [languages, setLanguages] = useState({});
    const [commits, setCommits] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [repoRes, healthRes, langRes, commitsRes] = await Promise.all([
                axios.get(`https://api.github.com/repos/${repoPath}`),
                axios.get(`https://api.github.com/repos/${repoPath}/community/profile`),
                axios.get(`https://api.github.com/repos/${repoPath}/languages`),
                axios.get(`https://api.github.com/repos/${repoPath}/commits?per_page=10`)
            ]);

            setRepoData(repoRes.data);
            setHealthData(healthRes.data);
            setLanguages(langRes.data);
            setCommits(commitsRes.data);
        } catch (error) {
            console.error("Error fetching GitHub data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [repoPath]);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-center min-h-[300px]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent animate-spin rounded-full" />
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-widest">Scanning Repository...</p>
                </div>
            </div>
        );
    }

    if (!repoData) return null;

    const topLanguages = Object.entries(languages)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    const totalLangValue = Object.values(languages).reduce((a, b) => a + b, 0);

    const formatRelativeTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="bg-slate-900 p-2 rounded-lg text-white">
                        <Github className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-sm">Repo Health</h3>
                        <p className="text-gray-400 text-[10px] font-medium uppercase tracking-wider">{repoPath}</p>
                    </div>
                </div>
                <a
                    href={repoData.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-indigo-600"
                >
                    <ExternalLink className="w-4 h-4" />
                </a>
            </div>

            <div className="p-6">
                {/* Main Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50">
                        <div className="flex items-center gap-2 mb-2">
                            <Star className="w-4 h-4 text-indigo-500 fill-indigo-500" />
                            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-tight">Stars</span>
                        </div>
                        <p className="text-2xl font-black text-indigo-900">{repoData.stargazers_count}</p>
                    </div>
                    <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50">
                        <div className="flex items-center gap-2 mb-2">
                            <GitFork className="w-4 h-4 text-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight">Forks</span>
                        </div>
                        <p className="text-2xl font-black text-emerald-900">{repoData.forks_count}</p>
                    </div>
                </div>

                {/* Secondary Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1.5 text-gray-400 mb-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-bold uppercase">Issues</span>
                        </div>
                        <p className="text-sm font-black text-gray-800">{repoData.open_issues_count}</p>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1.5 text-gray-400 mb-1">
                            <Eye className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-bold uppercase">Watchers</span>
                        </div>
                        <p className="text-sm font-black text-gray-800">{repoData.watchers_count}</p>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1.5 text-gray-400 mb-1">
                            <Activity className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-bold uppercase">Health</span>
                        </div>
                        <p className="text-sm font-black text-emerald-600">{healthData?.health_percentage || '—'}%</p>
                    </div>
                </div>

                {/* Health Bar */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Documentation & Standards</span>
                        <span className="text-[10px] font-black text-indigo-600">{healthData?.health_percentage || 0}% Score</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${healthData?.health_percentage || 0}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.4)]"
                        />
                    </div>
                </div>

                {/* Languages */}
                <div className="space-y-3 pt-6 border-t border-gray-50">
                    <div className="flex items-center gap-2 mb-3">
                        <Code2 className="w-4 h-4 text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Stack Composition</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 mb-6">
                        {topLanguages.map(([lang, value]) => {
                            const percent = Math.round((value / totalLangValue) * 100);
                            return (
                                <div key={lang} className="group">
                                    <div className="flex justify-between items-center text-[10px] mb-1">
                                        <span className="font-bold text-gray-600">{lang}</span>
                                        <span className="font-black text-indigo-600 opacity-60 group-hover:opacity-100 transition-opacity">{percent}%</span>
                                    </div>
                                    <div className="h-1 w-full bg-gray-50 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percent}%` }}
                                            transition={{ duration: 1.5, delay: 0.2 }}
                                            className="h-full bg-slate-900 rounded-full"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Latest Commits */}
                <div className="space-y-3 pt-6 border-t border-gray-50">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <GitCommit className="w-4 h-4 text-gray-400" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recent Activity</span>
                        </div>
                        <span className="text-[9px] font-black text-indigo-600/60 uppercase">Latest 10</span>
                    </div>
                    <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                        {commits.map((c, i) => (
                            <div key={i} className="group/commit">
                                <div className="flex items-start gap-2.5">
                                    <img
                                        src={c.author?.avatar_url || `https://ui-avatars.com/api/?name=${c.commit.author.name}&background=random`}
                                        alt={c.commit.author.name}
                                        className="w-6 h-6 rounded-full border border-gray-100"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-bold text-gray-800 line-clamp-1 group-hover/commit:text-indigo-600 transition-colors">
                                            {c.commit.message}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter truncate max-w-[80px]">
                                                {c.commit.author.name}
                                            </span>
                                            <span className="w-0.5 h-0.5 rounded-full bg-gray-300" />
                                            <span className="text-[8px] font-bold text-slate-400 flex items-center gap-1">
                                                <Clock className="w-2 h-2" />
                                                {formatRelativeTime(c.commit.author.date)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Last Update */}
                <div className="mt-6 flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-[10px] text-gray-500 font-medium">
                    <Calendar className="w-3 h-3" />
                    Project Pulse: Verified {new Date().toLocaleDateString()}
                </div>
            </div>
        </div>
    );
};

export default RepoHealth;
