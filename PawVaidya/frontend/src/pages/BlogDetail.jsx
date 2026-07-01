import React, { useState, useEffect, useContext } from 'react';
import { useAITranslation } from '../context/TranslationContext';
import { assets } from '../assets/assets_frontend/assets';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import RunningDogLoader from '../components/RunningDogLoader';
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  EyeIcon,
  TrashIcon,
  PencilIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartSolidIcon
} from '@heroicons/react/24/solid';


const BlogDetail = () => {
  const { t, i18n } = useTranslation();
  const { translateText, translateBatch } = useAITranslation();
  const { blogId } = useParams();
  const navigate = useNavigate();
  const { token, userdata, backendurl } = useContext(AppContext);
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchBlog();
  }, [blogId]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendurl}/api/user/blogs/${blogId}`);
      if (data.success) {
        setBlog(data.blog);
      } else {
        toast.error(data.message);
        navigate('/community?tab=blogs');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch blog');
      navigate('/community?tab=blogs');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      toast.error('Please login to like posts');
      return;
    }

    // Check if user is banned
    if (userdata.isBanned) {
      toast.error('Your account is banned. You cannot like posts.');
      return;
    }

    try {
      const { data } = await axios.post(
        `${backendurl}/api/user/blogs/${blogId}/like`,
        { userId: userdata.id },
        { headers: { token } }
      );

      if (data.success) {
        // Update likes array properly without refreshing the page
        setBlog(prev => {
          if (data.liked) {
            // Add like
            const newLikes = [...(prev.likes || []), { userId: userdata.id, likedAt: new Date() }];
            return { ...prev, likes: newLikes };
          } else {
            // Remove like
            const newLikes = (prev.likes || []).filter(like => like.userId !== userdata.id);
            return { ...prev, likes: newLikes };
          }
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to like post');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Please login to comment');
      return;
    }

    // Check if user is banned
    if (userdata.isBanned) {
      toast.error('Your account is banned. You cannot comment on posts.');
      return;
    }

    if (!comment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      setSubmittingComment(true);
      const { data } = await axios.post(
        `${backendurl}/api/user/blogs/${blogId}/comment`,
        { userId: userdata.id, comment },
        { headers: { token } }
      );

      if (data.success) {
        setComment('');
        toast.success('Comment added successfully');
        fetchBlog();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    // Check if user is banned
    if (userdata.isBanned) {
      toast.error('Your account is banned. You cannot delete comments.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const { data } = await axios.delete(
        `${backendurl}/api/user/blogs/${blogId}/comments/${commentId}`,
        {
          headers: { token },
          data: { userId: userdata.id }
        }
      );

      if (data.success) {
        toast.success('Comment deleted successfully');
        fetchBlog();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete comment');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === 'en' ? 'en-US' : i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    const translateBlogContent = async () => {
      if (!blog || i18n.language === 'en') return;

      try {
        const translatedTitle = await translateText(blog.title);
        const translatedContent = await translateText(blog.content);

        let translatedComments = blog.comments;
        if (blog.comments && blog.comments.length > 0) {
          const commentTexts = blog.comments.map(c => c.comment);
          const translatedCommentTexts = await translateBatch(commentTexts);
          translatedComments = blog.comments.map((c, i) => ({
            ...c,
            comment: translatedCommentTexts[i]
          }));
        }

        setBlog(prev => ({
          ...prev,
          title: translatedTitle,
          content: translatedContent,
          comments: translatedComments,
          translated: true
        }));
      } catch (error) {
        console.error('Translation error:', error);
      }
    };

    if (blog && !blog.translated) {
      translateBlogContent();
    }
  }, [i18n.language, blog]);

  const isObsidian = userdata?.subscription?.status === 'Active' && userdata?.subscription?.plan === 'Obsidian';

  if (loading) {
    return (
      <div className="min-h-screen py-8 flex flex-col items-center justify-center transition-colors duration-500" style={isObsidian ? { backgroundColor: '#050505' } : { backgroundColor: '#f2e4c7' }}>
        <RunningDogLoader />
        <p className={`mt-4 text-sm font-medium animate-pulse ${isObsidian ? 'text-[#E6C97A]' : 'text-amber-800'}`}>Loading blog details...</p>
      </div>
    );
  }

  if (!blog) {
    return null;
  }

  const isLiked = token && userdata && blog.likes?.some(like => like.userId === userdata.id);
  const isOwner = token && userdata && blog.userId === userdata.id;

  return (
    <div className="min-h-screen py-8 transition-colors duration-500" style={isObsidian ? { backgroundColor: '#050505' } : { backgroundColor: '#f2e4c7' }} >
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/community?tab=blogs')}
          className={`flex items-center gap-2 mb-6 transition-all duration-300 font-semibold group ${
            isObsidian ? 'text-[#E6C97A] hover:text-[#E6C97A]/80' : 'text-gray-600 hover:text-green-600'
          }`}
        >
          <ArrowLeftIcon className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          {t('blogs.backToBlogs')}
        </button>

        {/* Blog Content */}
        <div className={`rounded-2xl shadow-xl overflow-hidden border transition-all duration-500 ${
          isObsidian ? 'bg-[#0E0E0E] border-zinc-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.8)]' : 'bg-white border-gray-200 shadow-md'
        }`}>
          {/* Blog Header */}
          <div className={`p-6 border-b transition-colors duration-500 ${
            isObsidian ? 'border-zinc-800/80' : 'border-gray-200'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={blog.userImage || assets.profile_pic}
                  alt={blog.userName}
                  className={`w-12 h-12 rounded-full object-cover border-2 transition-all ${
                    isObsidian ? 'border-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'border-transparent'
                  }`}
                />
                <div>
                  <h3 className={`font-semibold transition-colors duration-500 flex items-center gap-1.5 ${
                    isObsidian ? 'text-[#F5F2EA]' : 'text-gray-900'
                  }`}>
                    {blog.userName}
                    {isObsidian && (
                      <svg className="w-4 h-4 text-emerald-500 fill-current" viewBox="0 0 20 20" title="Verified Member">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </h3>
                  <p className={`text-sm transition-colors duration-500 ${isObsidian ? 'text-neutral-500' : 'text-gray-500'}`}>{formatDate(blog.createdAt)}</p>
                </div>
              </div>
              {isOwner && (
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/edit-blog/${blog._id}`)}
                    className={`p-2 rounded-full transition-all ${
                      isObsidian ? 'text-[#E6C97A] hover:bg-zinc-800/85 hover:text-white' : 'text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <h1 className={`text-3xl font-black transition-colors duration-500 tracking-tight leading-snug mb-4 ${
              isObsidian ? 'text-[#F5F2EA]' : 'text-gray-900'
            }`}>{blog.title}</h1>

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {blog.tags.map((tag, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider transition-colors border ${
                      isObsidian 
                        ? 'bg-[#E6C97A]/10 border-[#E6C97A]/25 text-[#E6C97A]' 
                        : 'bg-green-100 border-green-200 text-green-700'
                    }`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Blog Actions */}
            <div className="flex items-center gap-4 mt-2">
              <button
                type="button"
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black transition-all ${
                  isObsidian 
                    ? isLiked 
                      ? 'bg-[#E6C97A]/10 border-[#E6C97A]/50 text-red-500 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                      : 'bg-[#0E0E0E] border-zinc-800 text-neutral-400 hover:border-[#E6C97A]/40 hover:text-[#E6C97A]'
                    : isLiked 
                      ? 'text-red-600 bg-red-50 border-red-100'
                      : 'text-gray-600 hover:text-red-600 bg-gray-50 border-gray-100'
                }`}
              >
                {isLiked ? (
                  <HeartSolidIcon className="w-4 h-4 text-red-500" />
                ) : (
                  <HeartIcon className="w-4 h-4" />
                )}
                <span>{blog.likes?.length || 0}</span>
              </button>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black transition-all ${
                isObsidian 
                  ? 'bg-[#0E0E0E] border-zinc-800 text-neutral-400' 
                  : 'text-gray-600 bg-gray-50 border-gray-100'
              }`}>
                <ChatBubbleLeftIcon className="w-4 h-4" />
                <span>{blog.comments?.length || 0}</span>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black transition-all ${
                isObsidian 
                  ? 'bg-[#0E0E0E] border-zinc-800 text-neutral-400' 
                  : 'text-gray-600 bg-gray-50 border-gray-100'
              }`}>
                <EyeIcon className="w-4 h-4" />
                <span>{blog.views || 0}</span>
              </div>
            </div>
          </div>

          {/* Blog Body */}
          <div className="p-6">
            <p className={`text-sm leading-relaxed whitespace-pre-wrap mb-6 transition-colors duration-500 ${
              isObsidian ? 'text-neutral-300' : 'text-gray-700'
            }`}>{blog.content}</p>

            {/* Images */}
            {blog.images && blog.images.length > 0 && (
              <div className={`grid gap-4 mb-6 ${blog.images.length === 1 ? 'grid-cols-1' :
                blog.images.length === 2 ? 'grid-cols-2' :
                  'grid-cols-3'
                }`}>
                {blog.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Blog image ${index + 1}`}
                    className="w-full h-auto rounded-2xl cursor-pointer hover:opacity-90 hover:scale-[1.01] transition-all duration-300 shadow-sm"
                    onClick={() => window.open(image, '_blank')}
                  />
                ))}
              </div>
            )}

            {/* Videos */}
            {blog.videos && blog.videos.length > 0 && (
              <div className="space-y-4 mb-6">
                {blog.videos.map((video, index) => (
                  <video
                    key={index}
                    src={video}
                    controls
                    className="w-full rounded-2xl"
                  >
                    Your browser does not support the video tag.
                  </video>
                ))}
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className={`p-6 border-t transition-colors duration-500 ${
            isObsidian ? 'bg-[#0A0A0A]/50 border-zinc-800/80' : 'bg-white border-gray-200'
          }`}>
            {isObsidian ? (
              <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-[#0E0E0E] border border-zinc-800/85">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#E6C97A]/10 border border-[#E6C97A]/25 text-[#E6C97A]">
                  <ChatBubbleLeftIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#F5F2EA]">
                    Comments ({blog.comments?.length || 0})
                  </h3>
                  <p className="text-xs text-neutral-500">Share your thoughts with the community</p>
                </div>
              </div>
            ) : (
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('blogs.comments')}</h2>
            )}

            {/* Comment Form */}
            {token && !userdata?.isBanned ? (
              <form onSubmit={handleComment} className="mb-6">
                <div className="flex gap-4">
                  <img
                    src={userdata?.image || assets.profile_pic}
                    alt={userdata?.name}
                    className={`w-10 h-10 rounded-full object-cover border-2 ${
                      isObsidian ? 'border-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'border-transparent'
                    }`}
                  />
                  <div className="flex-1">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={t('blogs.writeComment')}
                      rows={3}
                      className={`w-full px-5 py-4 border rounded-2xl focus:outline-none focus:ring-2 text-sm transition-all resize-none ${
                        isObsidian 
                          ? 'bg-[#0E0E0E] border-zinc-800 focus:ring-[#E6C97A] text-white focus:border-[#E6C97A]/50 placeholder-neutral-600' 
                          : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                      }`}
                      required
                    />
                    <button
                      type="submit"
                      disabled={submittingComment || !comment.trim()}
                      className={`mt-3 px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] ${
                        isObsidian 
                          ? 'bg-gradient-to-r from-[#8C6D23] via-[#E6C97A] to-[#8C6D23] text-black shadow-lg shadow-[#E6C97A]/10' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {isObsidian && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                      {submittingComment ? t('blogs.posting') : t('blogs.postComment')}
                    </button>
                  </div>
                </div>
              </form>
            ) : token && userdata?.isBanned ? (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">
                  Your account is banned. You cannot comment on posts.
                </p>
              </div>
            ) : null}

            {/* Comments List */}
            {blog.comments && blog.comments.length > 0 ? (
              <div className="space-y-4">
                {blog.comments.map((comment, index) => {
                  const canDelete = token && (comment.userId === userdata?.id || isOwner) && !userdata?.isBanned;
                  return (
                    <div key={index} className={`flex gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                      isObsidian ? 'bg-[#0E0E0E] border-zinc-800/80 text-white' : 'bg-gray-50 border-transparent'
                    }`}>
                      <img
                        src={comment.userImage || assets.profile_pic}
                        alt={comment.userName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className={`font-semibold transition-colors duration-500 ${
                              isObsidian ? 'text-[#F5F2EA]' : 'text-gray-900'
                            }`}>{comment.userName}</h4>
                            <p className={`text-xs ${isObsidian ? 'text-neutral-500' : 'text-gray-500'}`}>{formatDate(comment.commentedAt)}</p>
                          </div>
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteComment(comment._id)}
                              className={`p-1.5 rounded-full transition-all ${
                                isObsidian ? 'text-red-400 hover:bg-red-950/20' : 'text-red-600 hover:bg-red-50'
                              }`}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <p className={`text-sm ${isObsidian ? 'text-neutral-300' : 'text-gray-700'}`}>{comment.comment}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              isObsidian ? (
                <div className="text-center py-10 flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#E6C97A]/5 border border-[#E6C97A]/20 text-[#E6C97A] mb-4 relative">
                    <ChatBubbleLeftIcon className="w-6 h-6" />
                    <span className="absolute -top-1 -right-1 text-xs text-[#E6C97A] animate-pulse">✨</span>
                  </div>
                  <h4 className="text-sm font-black text-[#F5F2EA]">No comments yet.</h4>
                  <p className="text-xs text-neutral-500 mt-1">Be the first to comment!</p>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">{t('blogs.noComments')}</p>
              )
            )}
          </div>
        </div>
      </div>
    </div >
  );
};

export default BlogDetail;

