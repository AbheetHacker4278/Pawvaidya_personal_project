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
        navigate('/community-blogs');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch blog');
      navigate('/community-blogs');
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

  if (loading) {
    return (
      <div className="min-h-screen py-8 flex items-center justify-center" style={{ backgroundColor: '#f2e4c7' }}>
        <RunningDogLoader />
      </div>
    );
  }

  if (!blog) {
    return null;
  }

  const isLiked = token && userdata && blog.likes?.some(like => like.userId === userdata.id);
  const isOwner = token && userdata && blog.userId === userdata.id;

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: '#f2e4c7' }} >
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/community-blogs')}
          className="flex items-center gap-2 text-gray-600 hover:text-green-600 mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          {t('blogs.backToBlogs')}
        </button>

        {/* Blog Content */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Blog Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={blog.userImage || assets.profile_pic}
                  alt={blog.userName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{blog.userName}</h3>
                  <p className="text-sm text-gray-500">{formatDate(blog.createdAt)}</p>
                </div>
              </div>
              {isOwner && (
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/edit-blog/${blog._id}`)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">{blog.title}</h1>

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {blog.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Blog Actions */}
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={handleLike}
                className={`flex items-center gap-2 ${isLiked ? 'text-red-600' : 'text-gray-600'
                  } hover:text-red-600 transition-colors`}
              >
                {isLiked ? (
                  <HeartSolidIcon className="w-6 h-6" />
                ) : (
                  <HeartIcon className="w-6 h-6" />
                )}
                <span>{blog.likes?.length || 0}</span>
              </button>
              <div className="flex items-center gap-2 text-gray-600">
                <ChatBubbleLeftIcon className="w-6 h-6" />
                <span>{blog.comments?.length || 0}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <EyeIcon className="w-6 h-6" />
                <span>{blog.views || 0}</span>
              </div>
            </div>
          </div>

          {/* Blog Body */}
          <div className="p-6">
            <p className="text-gray-700 whitespace-pre-wrap mb-6">{blog.content}</p>

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
                    className="w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
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
                    className="w-full rounded-lg"
                  >
                    Your browser does not support the video tag.
                  </video>
                ))}
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="p-6 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('blogs.comments')}</h2>

            {/* Comment Form */}
            {token && !userdata?.isBanned ? (
              <form onSubmit={handleComment} className="mb-6">
                <div className="flex gap-4">
                  <img
                    src={userdata?.image || assets.profile_pic}
                    alt={userdata?.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={t('blogs.writeComment')}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                    <button
                      type="submit"
                      disabled={submittingComment || !comment.trim()}
                      className="mt-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
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
                    <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                      <img
                        src={comment.userImage || assets.profile_pic}
                        alt={comment.userName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{comment.userName}</h4>
                            <p className="text-sm text-gray-500">{formatDate(comment.commentedAt)}</p>
                          </div>
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteComment(comment._id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-gray-700">{comment.comment}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">{t('blogs.noComments')}</p>
            )}
          </div>
        </div>
      </div>
    </div >
  );
};

export default BlogDetail;

