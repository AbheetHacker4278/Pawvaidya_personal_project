import React, { useState, useEffect, useContext } from 'react';
import { assets } from '../assets/assets_frontend/assets';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import RunningDogLoader from '../components/RunningDogLoader';
import RoomsList from '../components/RoomsList';
import { motion, AnimatePresence } from 'framer-motion';
import { useAITranslation } from '../context/TranslationContext';
import {
  PlusIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  EyeIcon,
  TrashIcon,
  PencilIcon,
  FlagIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { extractLinks, getLinkSource, getSourceColor } from '../utils/linkUtils';

// ─── Brand palette ────────────────────────────────────────────────────────────
const B = {
  dark: '#3d2b1f',
  mid: '#5A4035',
  light: '#7a5a48',
  cream: '#f2e4c7',
  sand: '#e8d5b0',
  amber: '#c8860a',
  pale: '#fdf8f0',
};

const CommunityBlogs = () => {
  const { t, i18n } = useTranslation();
  const { token, userdata, backendurl } = useContext(AppContext);
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('feed'); // 'feed' or 'rooms'
  const { translateText, translateBatch } = useAITranslation();
  const [translating, setTranslating] = useState(false);
  const [likedCards, setLikedCards] = useState({});
  const [reportModal, setReportModal] = useState({ isOpen: false, blog: null });
  const [reportReason, setReportReason] = useState('inappropriate_content');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [newComments, setNewComments] = useState({});
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => { fetchBlogs(); }, [page, sortBy]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${backendurl}/api/user/blogs?page=${page}&limit=10&sort=${sortBy}`
      );
      if (data.success) {
        setBlogs(data.blogs);
        setTotalPages(data.totalPages);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch blogs');
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async () => {
    if (!token) return toast.error('Please login to report');
    if (!reportDescription.trim()) return toast.error('Please provide a description');

    try {
      setSubmittingReport(true);
      const { data } = await axios.post(`${backendurl}/api/report/submit`, {
        reporterType: userdata?.type || 'user',
        reporterId: userdata?.id,
        reportedType: 'user', // Community blogs are by users
        reportedId: reportModal.blog.userId,
        blogId: reportModal.blog._id,
        reason: reportReason,
        description: reportDescription
      }, { headers: { token } });

      if (data.success) {
        toast.success(t('blogs.reportSubmitted') || 'Report submitted successfully');
        setReportModal({ isOpen: false, blog: null });
        setReportDescription('');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error reporting blog:', error);
      toast.error('Failed to submit report');
    } finally {
      setSubmittingReport(false);
    }
  };

  useEffect(() => {
    const translateBlogs = async () => {
      if (i18n.language === 'en' || blogs.length === 0) return;
      setTranslating(true);
      try {
        const titles = blogs.map(b => b.title);
        const contents = blogs.map(b => b.content);

        const translatedTitles = await translateBatch(titles);
        const translatedContents = await translateBatch(contents);

        const updatedBlogs = blogs.map((blog, i) => ({
          ...blog,
          translatedTitle: translatedTitles[i],
          translatedContent: translatedContents[i],
          translatedLang: i18n.language
        }));
        setBlogs(updatedBlogs);
      } catch (error) {
        console.error('Translation error:', error);
      } finally {
        setTranslating(false);
      }
    };
    translateBlogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language, blogs.length]);

  const handleLike = async (e, blogId, currentIsLiked) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) { toast.error(t('blogs.pleaseLoginToLike')); return; }
    if (userdata.isBanned) { toast.error(t('blogs.accountBannedCannotLike')); return; }
    // Optimistic animation
    setLikedCards(prev => ({ ...prev, [blogId]: true }));
    setTimeout(() => setLikedCards(prev => ({ ...prev, [blogId]: false })), 600);
    try {
      const { data } = await axios.post(
        `${backendurl}/api/user/blogs/${blogId}/like`,
        { userId: userdata.id },
        { headers: { token } }
      );
      if (data.success) {
        setBlogs(blogs.map(blog => {
          if (blog._id === blogId) {
            if (data.liked) {
              return { ...blog, likes: [...(blog.likes || []), { userId: userdata.id, likedAt: new Date() }] };
            } else {
              return { ...blog, likes: (blog.likes || []).filter(like => like.userId !== userdata.id) };
            }
          }
          return blog;
        }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t('blogs.failedToLike'));
    }
  };

  const toggleComments = (blogId) => {
    setExpandedComments(prev => ({ ...prev, [blogId]: !prev[blogId] }));
  };

  const handleAddComment = async (e, blogId) => {
    e.preventDefault();
    if (!token) { toast.error('Please login to comment'); return; }
    if (userdata.isBanned) { toast.error('Account banned, cannot comment'); return; }
    if (!newComments[blogId]?.trim()) return;

    setSubmittingComment(true);
    try {
      const { data } = await axios.post(
        `${backendurl}/api/user/blogs/${blogId}/comment`,
        { userId: userdata.id, comment: newComments[blogId] },
        { headers: { token } }
      );
      if (data.success) {
        setNewComments(prev => ({ ...prev, [blogId]: '' }));
        // Optimistically update the blog in the state
        setBlogs(blogs.map(blog => {
          if (blog._id === blogId) {
            return {
              ...blog,
              comments: [...(blog.comments || []), data.comment]
            };
          }
          return blog;
        }));
        toast.success('Comment added');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (blogId, commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      const { data } = await axios.delete(
        `${backendurl}/api/user/blogs/${blogId}/comments/${commentId}`,
        { headers: { token }, data: { userId: userdata.id } }
      );
      if (data.success) {
        setBlogs(blogs.map(blog => {
          if (blog._id === blogId) {
            return {
              ...blog,
              comments: blog.comments.filter(c => c._id !== commentId)
            };
          }
          return blog;
        }));
        toast.success('Comment deleted');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete comment');
    }
  };

  const handleDelete = async (blogId) => {
    if (!window.confirm(t('blogs.confirmDelete'))) return;
    try {
      const { data } = await axios.delete(
        `${backendurl}/api/user/blogs/${blogId}`,
        { headers: { token }, data: { userId: userdata.id } }
      );
      if (data.success) { toast.success(t('blogs.postDeleted')); fetchBlogs(); }
    } catch (error) {
      toast.error(error.response?.data?.message || t('blogs.failedToDelete'));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen" style={{ background: B.cream }}>

      {/* ── Hero Header ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden py-14 px-4" style={{ background: `linear-gradient(135deg, ${B.dark} 0%, ${B.mid} 60%, ${B.light} 100%)` }}>
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        {/* Blobs */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: B.amber }} />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: '#fff' }} />

        <div className="relative z-10 max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Label pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3 border border-white/20"
              style={{ background: 'rgba(255,255,255,0.10)', color: '#f0d080' }}>
              <span>🐾</span> Community
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{t('blogs.title')}</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>{t('blogs.subtitle')}</p>
          </motion.div>

          {token && userdata && !userdata.isBanned && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              whileHover={{ scale: 1.06, boxShadow: `0 8px 24px rgba(200,134,10,0.40)` }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/create-blog')}
              className="lg:hidden flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-xl flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${B.amber}, #e8a020)` }}
            >
              <PlusIcon className="w-5 h-5" />
              {t('blogs.createPost')}
            </motion.button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8 items-start">
        {/* ── Main Feed / Rooms Column ─────────────────────────────────────── */}
        <div className="flex-1 min-w-0 w-full">

          {/* ── View Toggle Bar ──────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl mb-6 shadow-sm border inline-flex" style={{ borderColor: B.sand }}>
            <button
              onClick={() => setViewMode('feed')}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${viewMode === 'feed' ? 'bg-amber-50 text-amber-700 shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
            >
              Public Feed
            </button>
            <button
              onClick={() => setViewMode('rooms')}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${viewMode === 'rooms' ? 'bg-amber-50 text-amber-700 shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
            >
              Community Rooms
            </button>
          </div>

          {viewMode === 'rooms' ? (
            <RoomsList />
          ) : (
            <>
              {/* ── Sort bar ─────────────────────────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex items-center gap-3 mb-8"
              >
                <span className="text-sm font-semibold" style={{ color: B.light }}>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer focus:outline-none transition-all duration-200"
                  style={{
                    background: '#fff',
                    border: `1.5px solid ${B.sand}`,
                    color: B.dark,
                    boxShadow: '0 2px 8px rgba(90,64,53,0.07)',
                  }}
                >
                  <option value="newest">{t('blogs.newestFirst')}</option>
                  <option value="oldest">{t('blogs.oldestFirst')}</option>
                  <option value="most_liked">{t('blogs.mostLiked')}</option>
                </select>
              </motion.div>

              {/* ── Loading ───────────────────────────────────────────────────────── */}
              {loading || translating ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <RunningDogLoader />
                  <p className="mt-4 text-sm font-medium animate-pulse" style={{ color: B.light }}>
                    {translating ? t('blogs.translating') : t('common.loading')}
                  </p>
                </div>

              ) : blogs.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20 rounded-3xl border"
                  style={{ background: '#fff', borderColor: B.sand }}
                >
                  <div className="text-5xl mb-4">📝</div>
                  <p className="text-lg font-bold mb-1" style={{ color: B.dark }}>{t('blogs.noBlogs')}</p>
                  <p className="text-sm" style={{ color: B.light }}>Be the first to share something with the community!</p>
                </motion.div>

              ) : (
                <>
                  {/* ── Blog Cards ─────────────────────────────────────────────── */}
                  <div className="space-y-6">
                    <AnimatePresence>
                      {blogs.map((blog, index) => {
                        const isLiked = token && userdata && blog.likes?.some(like => like.userId === userdata.id);
                        const isOwner = token && userdata && blog.userId === userdata.id;
                        const links = extractLinks(blog.translatedContent || blog.content);

                        return (
                          <motion.div
                            key={blog._id}
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.4, delay: index * 0.07 }}
                            whileHover={{ border: `1px solid #7a5a48` }}
                            className="rounded-2xl overflow-hidden transition-colors duration-200 flex shadow-sm hover:shadow-md bg-white cursor-pointer"
                            style={{ border: `1px solid ${B.sand}` }}
                            onClick={() => navigate(`/blog/${blog._id}`)}
                          >
                            {/* ── Left Vote Column ─────────────────────────────── */}
                            <div className="w-12 sm:w-14 flex-shrink-0 flex flex-col items-center py-4 gap-1.5" style={{ background: B.pale, borderRight: `1px solid ${B.sand}` }} onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => handleLike(e, blog._id, isLiked)}
                                className={`p-1.5 rounded-md transition-colors ${isLiked ? 'text-[#2e7d32] bg-[#2e7d32]/10' : 'text-gray-400 hover:bg-[#2e7d32]/10 hover:text-[#2e7d32]'}`}
                                title={isLiked ? "Unlike" : "Like"}
                              >
                                <svg className="w-6 h-6" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                                </svg>
                              </button>
                              <span className={`text-sm font-bold ${isLiked ? 'text-[#2e7d32]' : 'text-gray-600'}`}>
                                {blog.likes?.length || 0}
                              </span>
                              <button
                                className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 transition-colors"
                                title="Downvote"
                              >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            </div>

                            {/* ── Right Content Area ───────────────────────────── */}
                            <div className="flex-1 p-4 sm:p-5 min-w-0">
                              {/* ── Author row ─────────────────────────────────── */}
                              <div className="flex items-start justify-between mb-5">
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    <img
                                      src={blog.userImage || assets.profile_pic}
                                      alt={blog.userName}
                                      className="w-12 h-12 rounded-full object-cover"
                                      style={{ border: `2.5px solid ${B.sand}` }}
                                    />
                                    {/* Online dot */}
                                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
                                      style={{ background: '#22c55e' }} />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h3 className="font-bold text-base" style={{ color: B.dark }}>{blog.userName}</h3>
                                      {blog.authorType === 'doctor' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold text-white shadow-sm"
                                          style={{ background: `linear-gradient(135deg, ${B.mid}, ${B.amber})` }}>
                                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                          </svg>
                                          {t('blogs.doctor')}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs mt-0.5" style={{ color: B.light }}>
                                      {blog.authorType === 'doctor' && blog.authorSpeciality && (
                                        <span className="font-semibold" style={{ color: B.amber }}>{blog.authorSpeciality} • </span>
                                      )}
                                      {formatDate(blog.createdAt)}
                                    </p>
                                  </div>
                                </div>

                                {/* Owner actions */}
                                {isOwner && !userdata.isBanned && (
                                  <div className="flex gap-1.5">
                                    <motion.button
                                      whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.93 }}
                                      onClick={() => navigate(`/edit-blog/${blog._id}`)}
                                      className="p-2 rounded-xl transition-colors duration-200"
                                      style={{ color: B.mid, background: '#f5ede8' }}
                                    >
                                      <PencilIcon className="w-4 h-4" />
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.93 }}
                                      onClick={() => handleDelete(blog._id)}
                                      className="p-2 rounded-xl transition-colors duration-200"
                                      style={{ color: '#c0392b', background: '#fff5f5' }}
                                    >
                                      <TrashIcon className="w-4 h-4" />
                                    </motion.button>
                                  </div>
                                )}
                              </div>

                              {/* ── Title ──────────────────────────────────────── */}
                              <h2
                                className="text-xl md:text-2xl font-bold mb-3 cursor-pointer transition-colors duration-200 hover:underline"
                                style={{ color: B.dark }}
                                onClick={() => navigate(`/blog/${blog._id}`)}
                              >
                                {blog.translatedTitle || blog.title}
                              </h2>

                              {/* ── Content ────────────────────────────────────── */}
                              <p className="text-sm leading-relaxed mb-4 whitespace-pre-wrap" style={{ color: '#4a3728' }}>
                                {blog.translatedContent || blog.content}
                                {links.length > 0 && (
                                  <span className="block mt-2 flex flex-wrap gap-2">
                                    {links.map((link, idx) => {
                                      const source = getLinkSource(link);
                                      const colorClass = getSourceColor(source);
                                      return (
                                        <a key={idx} href={link} target="_blank" rel="noopener noreferrer"
                                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${colorClass} hover:opacity-80 transition-opacity no-underline`}
                                          onClick={(e) => e.stopPropagation()}>
                                          🔗 {source}
                                        </a>
                                      );
                                    })}
                                  </span>
                                )}
                              </p>

                              {/* ── Tags ───────────────────────────────────────── */}
                              {blog.tags && blog.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {blog.tags.map((tag, tagIndex) => (
                                    <motion.span
                                      key={tagIndex}
                                      whileHover={{ scale: 1.08 }}
                                      className="px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all duration-200"
                                      style={{ background: '#fff8e6', color: B.amber, border: `1px solid #f0d080` }}
                                    >
                                      #{tag}
                                    </motion.span>
                                  ))}
                                </div>
                              )}

                              {/* ── Images ─────────────────────────────────────── */}
                              {blog.images && blog.images.length > 0 && (
                                <div className={`grid gap-3 mb-4 ${blog.images.length === 1 ? 'grid-cols-1' : blog.images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                  {blog.images.map((image, imgIndex) => (
                                    <motion.div
                                      key={imgIndex}
                                      whileHover={{ scale: 1.02 }}
                                      className="overflow-hidden rounded-xl shadow-md cursor-pointer group"
                                      style={{ border: `1px solid ${B.sand}` }}
                                      onClick={() => window.open(image, '_blank')}
                                    >
                                      <img src={image} alt={`Blog image ${imgIndex + 1}`}
                                        className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110" />
                                    </motion.div>
                                  ))}
                                </div>
                              )}

                              {/* ── Videos ─────────────────────────────────────── */}
                              {blog.videos && blog.videos.length > 0 && (
                                <div className="space-y-4 mb-4">
                                  {blog.videos.map((video, vidIndex) => (
                                    <div key={vidIndex} className="rounded-xl overflow-hidden shadow-md" style={{ border: `1px solid ${B.sand}` }}>
                                      <video src={video} controls className="w-full">{t('blogs.videoNotSupported')}</video>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* ── Action bar ─────────────────────────────────── */}
                              <div className="flex items-center gap-2 pt-2 mt-2" onClick={(e) => e.stopPropagation()}>
                                {/* Comments */}
                                <motion.button
                                  whileHover={{ backgroundColor: '#fdf8f0' }}
                                  onClick={() => toggleComments(blog._id)}
                                  className={`flex items-center gap-1.5 font-bold text-xs sm:text-sm px-2 py-1.5 rounded-md transition-colors duration-200 ${expandedComments[blog._id] ? 'bg-amber-50 text-amber-600' : ''}`}
                                  style={{ color: expandedComments[blog._id] ? B.amber : B.light }}
                                >
                                  <ChatBubbleLeftIcon className="w-5 h-5" />
                                  {blog.comments?.length || 0} Comments
                                </motion.button>


                                {/* Views */}
                                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm px-2 py-1.5 rounded-md" style={{ color: B.light }}>
                                  <EyeIcon className="w-5 h-5" />
                                  {blog.views || 0}
                                </div>

                                {/* Report */}
                                {userdata?.id !== blog.userId && (
                                  <motion.button
                                    whileHover={{ backgroundColor: '#fff5f5' }}
                                    onClick={() => setReportModal({ isOpen: true, blog })}
                                    className="flex items-center gap-1.5 font-bold text-xs sm:text-sm px-2 py-1.5 rounded-md transition-colors duration-200 hover:text-red-500"
                                    style={{ color: B.light }}
                                    title="Report this post"
                                  >
                                    <FlagIcon className="w-5 h-5" />
                                    <span className="hidden sm:inline">Report</span>
                                  </motion.button>
                                )}
                              </div>

                              {/* ── Inline Comments Section ────────────────────── */}
                              <AnimatePresence>
                                {expandedComments[blog._id] && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-4 pt-4 border-t overflow-hidden"
                                    style={{ borderColor: B.sand }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {/* Comment Input */}
                                    {token && userdata && !userdata.isBanned && (
                                      <form onSubmit={(e) => handleAddComment(e, blog._id)} className="flex gap-3 mb-6">
                                        <img
                                          src={userdata.image || assets.profile_pic}
                                          alt="You"
                                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                          style={{ border: `1px solid ${B.sand}` }}
                                        />
                                        <div className="flex-1 flex gap-2">
                                          <input
                                            type="text"
                                            placeholder="Add a comment..."
                                            value={newComments[blog._id] || ''}
                                            onChange={(e) => setNewComments({ ...newComments, [blog._id]: e.target.value })}
                                            className="flex-1 bg-gray-50 border px-3 py-1.5 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:bg-white transition-colors"
                                            style={{ borderColor: B.sand, color: B.dark }}
                                          />
                                          <button
                                            type="submit"
                                            disabled={submittingComment || !newComments[blog._id]?.trim()}
                                            className="px-4 py-1.5 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-50"
                                            style={{ background: B.amber }}
                                          >
                                            Post
                                          </button>
                                        </div>
                                      </form>
                                    )}

                                    {/* Comments List */}
                                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                      {blog.comments && blog.comments.length > 0 ? (
                                        blog.comments.map((comment, cIndex) => (
                                          <div key={cIndex} className="flex gap-3">
                                            <img
                                              src={comment.userImage || assets.profile_pic}
                                              alt={comment.userName}
                                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                              style={{ border: `1px solid ${B.sand}` }}
                                            />
                                            <div className="flex-1 bg-gray-50 rounded-xl p-3" style={{ border: `1px solid #f0f0f0` }}>
                                              <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-sm" style={{ color: B.dark }}>{comment.userName}</span>
                                                <span className="text-xs" style={{ color: B.light }}>{formatDate(comment.commentedAt)}</span>
                                                {token && userdata && userdata.id === comment.userId && !userdata.isBanned && (
                                                  <button
                                                    onClick={() => handleDeleteComment(blog._id, comment._id)}
                                                    className="ml-auto text-red-500 hover:text-red-700 transition-colors"
                                                    title="Delete your comment"
                                                  >
                                                    <TrashIcon className="w-4 h-4" />
                                                  </button>
                                                )}
                                              </div>
                                              <p className="text-sm" style={{ color: B.mid }}>{comment.comment}</p>
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="text-center py-6 text-sm italic" style={{ color: B.light }}>
                                          No comments yet. Be the first to share your thoughts!
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  {/* ── Pagination ───────────────────────────────────────────────── */}
                  {totalPages > 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="flex justify-center items-center gap-3 mt-10"
                    >
                      <motion.button
                        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          background: page === 1 ? B.sand : '#fff',
                          color: B.mid,
                          border: `1.5px solid ${B.sand}`,
                          boxShadow: '0 2px 8px rgba(90,64,53,0.07)',
                        }}
                      >
                        {t('common.previous')}
                      </motion.button>

                      <span className="px-5 py-2.5 rounded-xl font-bold text-sm"
                        style={{ background: `linear-gradient(135deg, ${B.mid}, ${B.amber})`, color: '#fff', boxShadow: '0 4px 12px rgba(90,64,53,0.20)' }}>
                        {page} / {totalPages}
                      </span>

                      <motion.button
                        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          background: page === totalPages ? B.sand : '#fff',
                          color: B.mid,
                          border: `1.5px solid ${B.sand}`,
                          boxShadow: '0 2px 8px rgba(90,64,53,0.07)',
                        }}
                      >
                        {t('common.next')}
                      </motion.button>
                    </motion.div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* ── Right Sidebar (Community Info) ─────────────────────────────── */}
        <div className="hidden lg:block w-[320px] flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: '#fff', border: `1px solid ${B.sand}` }}>
              <div className="h-12" style={{ background: `linear-gradient(135deg, ${B.mid}, ${B.amber})` }} />
              <div className="p-5 relative">
                <div className="absolute -top-6 left-5 w-14 h-14 rounded-full border-4 border-white flex items-center justify-center text-2xl shadow-sm" style={{ background: B.cream }}>
                  🐾
                </div>
                <h2 className="font-bold text-lg mt-8 mb-2" style={{ color: B.dark }}>Pawvaidya Community</h2>
                <p className="text-sm leading-relaxed mb-5" style={{ color: B.light }}>
                  Welcome to the Pawvaidya Community! Share your pet stories, ask for advice, and connect with other pet lovers and veterinary professionals.
                </p>
                {token && userdata && !userdata.isBanned && (
                  <button
                    onClick={() => navigate('/create-blog')}
                    className="w-full flex justify-center items-center gap-2 px-6 py-2.5 rounded-full font-bold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95 hover:shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${B.amber}, #e8a020)` }}
                  >
                    <PlusIcon className="w-5 h-5" />
                    Create Post
                  </button>
                )}
              </div>
            </div>

            {/* Rules card */}
            <div className="rounded-2xl p-5 shadow-sm" style={{ background: '#fff', border: `1px solid ${B.sand}` }}>
              <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: B.dark }}>
                <span className="text-lg">📜</span> Community Rules
              </h3>
              <ul className="text-sm space-y-3 font-medium" style={{ color: B.mid }}>
                <li className="flex gap-2"><span>1.</span> Be kind and respectful to everyone.</li>
                <li className="flex gap-2"><span>2.</span> No medical misinformation. Verify with a vet.</li>
                <li className="flex gap-2"><span>3.</span> Avoid spam or self-promotion.</li>
                <li className="flex gap-2"><span>4.</span> Use the report button for inappropriate content.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      {/* ── Report Modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {reportModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setReportModal({ isOpen: false, blog: null })}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6" style={{ background: `linear-gradient(to right, ${B.dark}, ${B.mid})` }}>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <FlagIcon className="w-6 h-6 text-red-400" />
                  Report Blog Post
                </h3>
                <p className="text-cream/80 text-sm mt-1">Help us understand what's wrong with this post.</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-3 rounded-lg border border-amber-100 bg-amber-50">
                  <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Reporting Post</p>
                  <p className="text-sm text-gray-800 font-semibold line-clamp-1">{reportModal.blog?.title}</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Reason for reporting</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-amber-400 focus:outline-none transition-colors"
                  >
                    <option value="inappropriate_content">Inappropriate Content</option>
                    <option value="copyright_violation">Copyright Violation</option>
                    <option value="medical_misinformation">Medical Misinformation</option>
                    <option value="harassment">Harassment</option>
                    <option value="spam">Spam</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                  <textarea
                    rows="4"
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Provide more details about why you are reporting this post..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-amber-400 focus:outline-none transition-colors resize-none"
                  ></textarea>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setReportModal({ isOpen: false, blog: null })}
                    className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReport}
                    disabled={submittingReport}
                    className="flex-1 py-3 rounded-xl font-bold text-white shadow-lg shadow-amber-200 transition-transform active:scale-95 disabled:opacity-50"
                    style={{ background: B.amber }}
                  >
                    {submittingReport ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommunityBlogs;
