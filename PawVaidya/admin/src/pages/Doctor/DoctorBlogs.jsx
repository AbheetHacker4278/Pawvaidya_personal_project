import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DoctorContext } from '../../context/DoctorContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { assets } from '../../assets/assets_admin/assets';
import {
  Plus as PlusIcon,
  Image as PhotoIcon,
  Video as VideoCameraIcon,
  X as XMarkIcon,
  Edit as PencilIcon,
  Trash2 as TrashIcon,
  Eye as EyeIcon,
  Heart as HeartIcon,
  MessageCircle as ChatBubbleLeftIcon
} from 'lucide-react';

const DoctorBlogs = () => {
  const { dtoken, backendurl } = useContext(DoctorContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'my-blogs', or 'community'
  const [loading, setLoading] = useState(false);
  const [blogs, setBlogs] = useState([]);
  const [communityBlogs, setCommunityBlogs] = useState([]);
  const [commentText, setCommentText] = useState({});
  const [showComments, setShowComments] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: ''
  });
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);

  useEffect(() => {
    if (activeTab === 'my-blogs') {
      fetchMyBlogs();
    } else if (activeTab === 'community') {
      fetchCommunityBlogs();
    }
  }, [activeTab]);

  const fetchMyBlogs = async () => {
    try {
      setLoading(true);
      const { data } = await axios.post(
        `${backendurl}/api/doctor/blogs/my-blogs`,
        {},
        { headers: { dtoken } }
      );
      if (data.success) {
        setBlogs(data.blogs);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch blogs');
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunityBlogs = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${backendurl}/api/doctor/blogs/community?page=1&limit=20&sort=newest`,
        { headers: { dtoken } }
      );
      if (data.success) {
        setCommunityBlogs(data.blogs);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch community blogs');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (blogId) => {
    try {
      const { data } = await axios.post(
        `${backendurl}/api/doctor/blogs/like`,
        { blogId },
        { headers: { dtoken } }
      );

      if (data.success) {
        // Update the blog in community blogs list
        setCommunityBlogs(communityBlogs.map(blog => {
          if (blog._id === blogId) {
            const updatedLikes = data.liked
              ? [...(blog.likes || []), { userId: 'current-doctor', likedAt: new Date() }]
              : (blog.likes || []).filter(like => like.userId !== 'current-doctor');
            return { ...blog, likes: updatedLikes };
          }
          return blog;
        }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to like post');
    }
  };

  const handleComment = async (blogId) => {
    const comment = commentText[blogId];
    if (!comment || !comment.trim()) {
      toast.warn('Please enter a comment');
      return;
    }

    try {
      const { data } = await axios.post(
        `${backendurl}/api/doctor/blogs/comment`,
        { blogId, comment },
        { headers: { dtoken } }
      );

      if (data.success) {
        toast.success('Comment added');
        // Update the blog with new comment
        setCommunityBlogs(communityBlogs.map(blog => {
          if (blog._id === blogId) {
            return {
              ...blog,
              comments: [...(blog.comments || []), data.comment]
            };
          }
          return blog;
        }));
        // Clear comment input
        setCommentText({ ...commentText, [blogId]: '' });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    }
  };

  const handleViewBlog = async (blogId) => {
    try {
      await axios.post(
        `${backendurl}/api/doctor/blogs/view`,
        { blogId },
        { headers: { dtoken } }
      );
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    const newImages = [];
    const newPreviews = [];

    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 10MB`);
        return;
      }

      newImages.push(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target.result);
        if (newPreviews.length === files.length) {
          setImagePreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setImages(prev => [...prev, ...newImages]);
  };

  const handleVideoChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + videos.length > 2) {
      toast.error('Maximum 2 videos allowed');
      return;
    }

    const newVideos = [];
    const newPreviews = [];

    files.forEach(file => {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 50MB`);
        return;
      }

      newVideos.push(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target.result);
        if (newPreviews.length === files.length) {
          setVideoPreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setVideos(prev => [...prev, ...newVideos]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
    setVideoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      setLoading(true);
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);

      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      formDataToSend.append('tags', JSON.stringify(tagsArray));

      images.forEach(image => {
        formDataToSend.append('images', image);
      });

      videos.forEach(video => {
        formDataToSend.append('videos', video);
      });

      const { data } = await axios.post(
        `${backendurl}/api/doctor/blogs/create`,
        formDataToSend,
        {
          headers: {
            dtoken,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (data.success) {
        toast.success('Blog post created successfully!');
        setFormData({ title: '', content: '', tags: '' });
        setImages([]);
        setVideos([]);
        setImagePreviews([]);
        setVideoPreviews([]);
        setActiveTab('my-blogs');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create blog post');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (blogId) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) {
      return;
    }

    try {
      const { data } = await axios.post(
        `${backendurl}/api/doctor/blogs/delete`,
        { blogId },
        { headers: { dtoken } }
      );

      if (data.success) {
        toast.success('Blog deleted successfully');
        fetchMyBlogs();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete blog');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Doctor Blogs</h1>
              <p className="text-gray-600 mt-1">Share your expertise with the community</p>
            </div>
            <div className="bg-gradient-to-r from-[#5A4035] to-[#7a5a48] px-4 py-2 rounded-lg">
              <span className="text-white font-semibold">🩺 Doctor</span>
            </div>
          </div>
        </motion.div>

        {/* Horizontal Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Tabs */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-4 sticky top-4">
              <button
                onClick={() => setActiveTab('create')}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all mb-3 flex items-center justify-center gap-2 ${activeTab === 'create'
                    ? 'bg-gradient-to-r from-[#5A4035] to-[#7a5a48] text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <PlusIcon className="w-5 h-5" />
                <span className="hidden xl:inline">Create</span>
              </button>
              <button
                onClick={() => setActiveTab('my-blogs')}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all mb-3 flex items-center justify-center gap-2 ${activeTab === 'my-blogs'
                    ? 'bg-gradient-to-r from-[#5A4035] to-[#7a5a48] text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <EyeIcon className="w-5 h-5" />
                <span className="hidden xl:inline">My Blogs</span>
              </button>
              <button
                onClick={() => setActiveTab('community')}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'community'
                    ? 'bg-gradient-to-r from-[#5A4035] to-[#7a5a48] text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <ChatBubbleLeftIcon className="w-5 h-5" />
                <span className="hidden xl:inline">Community</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-10">
            <AnimatePresence mode="wait">
              {activeTab === 'create' && (
                <motion.div
                  key="create"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white rounded-2xl shadow-lg p-6"
                >
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Blog Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Enter an engaging title..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A4035] focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Content */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Content *
                      </label>
                      <textarea
                        name="content"
                        value={formData.content}
                        onChange={handleInputChange}
                        placeholder="Share your medical insights, tips, or experiences..."
                        rows={10}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A4035] focus:border-transparent resize-none"
                        required
                      />
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Tags (comma separated)
                      </label>
                      <input
                        type="text"
                        name="tags"
                        value={formData.tags}
                        onChange={handleInputChange}
                        placeholder="e.g., pet care, vaccination, nutrition"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A4035] focus:border-transparent"
                      />
                    </div>

                    {/* Images */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Images (Max 5, 10MB each)
                      </label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-all">
                          <PhotoIcon className="w-5 h-5" />
                          <span>Add Images</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                        <span className="text-sm text-gray-600">{images.length}/5 images</span>
                      </div>
                      {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Videos */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Videos (Max 2, 50MB each)
                      </label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg cursor-pointer hover:bg-purple-100 transition-all">
                          <VideoCameraIcon className="w-5 h-5" />
                          <span>Add Videos</span>
                          <input
                            type="file"
                            accept="video/*"
                            multiple
                            onChange={handleVideoChange}
                            className="hidden"
                          />
                        </label>
                        <span className="text-sm text-gray-600">{videos.length}/2 videos</span>
                      </div>
                      {videoPreviews.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          {videoPreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                              <video
                                src={preview}
                                controls
                                className="w-full h-48 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => removeVideo(index)}
                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-[#5A4035] to-[#7a5a48] text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Publishing...' : 'Publish Blog Post'}
                    </button>
                  </form>
                </motion.div>
              )}
              {activeTab === 'my-blogs' && (
                <motion.div
                  key="my-blogs"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5A4035] mx-auto"></div>
                      <p className="text-gray-600 mt-4">Loading your blogs...</p>
                    </div>
                  ) : blogs.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                      <PlusIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg">No blogs yet</p>
                      <p className="text-gray-500 mt-2">Create your first blog post to share with the community</p>
                      <button
                        onClick={() => setActiveTab('create')}
                        className="mt-6 bg-gradient-to-r from-[#5A4035] to-[#7a5a48] text-white py-2 px-6 rounded-lg font-semibold hover:shadow-lg transition-all"
                      >
                        Create Blog
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
                      {blogs.map((blog) => (
                        <motion.div
                          key={blog._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h3 className="text-2xl font-bold text-gray-800 mb-2">{blog.title}</h3>
                              <p className="text-gray-600 line-clamp-3">{blog.content}</p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => handleDelete(blog._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          {/* Images */}
                          {blog.images && blog.images.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                              {blog.images.slice(0, 4).map((image, index) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt={`Blog image ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-lg"
                                />
                              ))}
                            </div>
                          )}

                          {/* Stats */}
                          <div className="flex items-center gap-6 text-sm text-gray-600 pt-4 border-t">
                            <div className="flex items-center gap-2">
                              <HeartIcon className="w-5 h-5" />
                              <span>{blog.likes?.length || 0} likes</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ChatBubbleLeftIcon className="w-5 h-5" />
                              <span>{blog.comments?.length || 0} comments</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <EyeIcon className="w-5 h-5" />
                              <span>{blog.views || 0} views</span>
                            </div>
                            <div className="ml-auto text-gray-500">
                              {new Date(blog.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
              {activeTab === 'community' && (
                <motion.div
                  key="community"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5A4035] mx-auto"></div>
                      <p className="text-gray-600 mt-4">Loading community blogs...</p>
                    </div>
                  ) : communityBlogs.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                      <ChatBubbleLeftIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg">No community blogs yet</p>
                    </div>
                  ) : (
                    <div className="space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
                      {communityBlogs.map((blog) => {
                        const isLiked = blog.likes?.some(like => like.userId === 'current-doctor');

                        return (
                          <motion.div
                            key={blog._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all"
                            onMouseEnter={() => handleViewBlog(blog._id)}
                          >
                            {/* Author Info */}
                            <div className="flex items-center gap-3 mb-4">
                              <img
                                src={blog.userImage || assets.people_icon}
                                alt={blog.userName}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-gray-800">{blog.userName}</h3>
                                  {blog.authorType === 'doctor' && (
                                    <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">Doctor</span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">
                                  {blog.authorSpeciality && <span className="text-blue-600 font-medium">{blog.authorSpeciality} • </span>}
                                  {new Date(blog.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            {/* Blog Content */}
                            <h2 className="text-2xl font-bold text-gray-800 mb-3">{blog.title}</h2>
                            <p className="text-gray-600 mb-4 line-clamp-3">{blog.content}</p>

                            {/* Images */}
                            {blog.images && blog.images.length > 0 && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                                {blog.images.slice(0, 4).map((image, index) => (
                                  <img
                                    key={index}
                                    src={image}
                                    alt={`Blog image ${index + 1}`}
                                    className="w-full h-32 object-cover rounded-lg"
                                  />
                                ))}
                              </div>
                            )}

                            {/* Interaction Buttons */}
                            <div className="flex items-center gap-4 pt-4 border-t">
                              <button
                                onClick={() => handleLike(blog._id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isLiked
                                    ? 'bg-red-50 text-red-600'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                              >
                                <HeartIcon className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                                <span>{blog.likes?.length || 0}</span>
                              </button>
                              <button
                                onClick={() => setShowComments({ ...showComments, [blog._id]: !showComments[blog._id] })}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                              >
                                <ChatBubbleLeftIcon className="w-5 h-5" />
                                <span>{blog.comments?.length || 0}</span>
                              </button>
                              <div className="flex items-center gap-2 text-gray-600 ml-auto">
                                <EyeIcon className="w-5 h-5" />
                                <span>{blog.views || 0} views</span>
                              </div>
                            </div>

                            {/* Comments Section */}
                            {showComments[blog._id] && (
                              <div className="mt-4 pt-4 border-t">
                                {/* Add Comment */}
                                <div className="flex gap-2 mb-4">
                                  <input
                                    type="text"
                                    value={commentText[blog._id] || ''}
                                    onChange={(e) => setCommentText({ ...commentText, [blog._id]: e.target.value })}
                                    placeholder="Add a comment..."
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A4035] focus:border-transparent"
                                    onKeyPress={(e) => e.key === 'Enter' && handleComment(blog._id)}
                                  />
                                  <button
                                    onClick={() => handleComment(blog._id)}
                                    className="px-4 py-2 bg-gradient-to-r from-[#5A4035] to-[#7a5a48] text-white rounded-lg hover:shadow-lg transition-all"
                                  >
                                    Post
                                  </button>
                                </div>

                                {/* Comments List */}
                                {blog.comments && blog.comments.length > 0 && (
                                  <div className="space-y-3">
                                    {blog.comments.map((comment, index) => (
                                      <div key={index} className="flex gap-3 bg-gray-50 p-3 rounded-lg">
                                        <img
                                          src={comment.userImage || assets.people_icon}
                                          alt={comment.userName}
                                          className="w-8 h-8 rounded-full object-cover"
                                        />
                                        <div className="flex-1">
                                          <p className="font-semibold text-sm text-gray-800">{comment.userName}</p>
                                          <p className="text-gray-600 text-sm">{comment.comment}</p>
                                          <p className="text-xs text-gray-500 mt-1">
                                            {new Date(comment.commentedAt).toLocaleDateString()}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorBlogs;
