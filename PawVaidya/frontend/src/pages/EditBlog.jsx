import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { PhotoIcon, VideoCameraIcon, XMarkIcon } from '@heroicons/react/24/outline';

const EditBlog = () => {
  const { t } = useTranslation();
  const { blogId } = useParams();
  const navigate = useNavigate();
  const { token, userdata, backendurl } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: ''
  });
  const [existingImages, setExistingImages] = useState([]);
  const [existingVideos, setExistingVideos] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newVideos, setNewVideos] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);

  useEffect(() => {
    if (!token || !userdata) {
      toast.error('Please login to edit a blog post');
      navigate('/login-form');
      return;
    }
    
    // Check if user is banned
    if (userdata.isBanned) {
      toast.error('Your account is banned. You cannot edit blog posts.');
      navigate('/');
      return;
    }
    
    fetchBlog();
  }, [token, userdata, blogId]);

  const fetchBlog = async () => {
    try {
      setFetching(true);
      const { data } = await axios.get(`${backendurl}/api/user/blogs/${blogId}`);
      if (data.success) {
        // Check if user owns the blog
        if (data.blog.userId !== userdata.id) {
          toast.error('You can only edit your own blog posts');
          navigate('/community-blogs');
          return;
        }

        setFormData({
          title: data.blog.title || '',
          content: data.blog.content || '',
          tags: data.blog.tags ? data.blog.tags.join(', ') : ''
        });
        setExistingImages(data.blog.images || []);
        setExistingVideos(data.blog.videos || []);
      } else {
        toast.error(data.message);
        navigate('/community-blogs');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch blog');
      navigate('/community-blogs');
    } finally {
      setFetching(false);
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
    if (files.length + newImages.length > 5) {
      toast.error('Maximum 5 new images allowed');
      return;
    }

    const addedImages = [];
    const addedPreviews = [];

    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 10MB`);
        return;
      }

      addedImages.push(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        addedPreviews.push(e.target.result);
        if (addedPreviews.length === files.length) {
          setImagePreviews(prev => [...prev, ...addedPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setNewImages(prev => [...prev, ...addedImages]);
  };

  const handleVideoChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + newVideos.length > 3) {
      toast.error('Maximum 3 new videos allowed');
      return;
    }

    const addedVideos = [];
    const addedPreviews = [];

    files.forEach(file => {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 50MB`);
        return;
      }

      addedVideos.push(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        addedPreviews.push(e.target.result);
        if (addedPreviews.length === files.length) {
          setVideoPreviews(prev => [...prev, ...addedPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setNewVideos(prev => [...prev, ...addedVideos]);
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingVideo = (index) => {
    setExistingVideos(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewVideo = (index) => {
    setNewVideos(prev => prev.filter((_, i) => i !== index));
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
      const data = new FormData();
      data.append('userId', userdata.id);
      data.append('title', formData.title);
      data.append('content', formData.content);
      data.append('tags', JSON.stringify(
        formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      ));

      // Send remaining existing images and videos (always send as JSON string)
      data.append('remainingImages', JSON.stringify(existingImages || []));
      data.append('remainingVideos', JSON.stringify(existingVideos || []));

      // Add new images
      newImages.forEach((image) => {
        data.append('images', image);
      });

      // Add new videos
      newVideos.forEach((video) => {
        data.append('videos', video);
      });

      const { data: response } = await axios.put(
        `${backendurl}/api/user/blogs/${blogId}`,
        data,
        {
          headers: {
            token
            // Don't set Content-Type - let axios set it automatically for FormData
          }
        }
      );

      if (response.success) {
        toast.success('Blog post updated successfully!');
        navigate(`/blog/${blogId}`);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Update blog error:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update blog post';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen py-8 flex items-center justify-center" style={{ backgroundColor: '#f2e4c7' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Loading blog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: '#f2e4c7' }}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('blogs.editBlog')}</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('blogs.blogTitle')} *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter blog title"
                required
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('blogs.content')} *
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder={t('blogs.content')}
                required
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('blogs.tags')}
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder={t('blogs.tagsPlaceholder')}
              />
            </div>

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('blogs.existingImages')}
                </label>
                <div className="flex flex-wrap gap-4 mb-4">
                  {existingImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Existing ${index + 1}`}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('blogs.addNewImages')} ({t('blogs.maxImages')})
              </label>
              <div className="flex flex-wrap gap-4 mb-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`New Preview ${index + 1}`}
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 w-fit">
                <PhotoIcon className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-700">{t('blogs.addImages')}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Existing Videos */}
            {existingVideos.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('blogs.existingVideos')}
                </label>
                <div className="flex flex-wrap gap-4 mb-4">
                  {existingVideos.map((video, index) => (
                    <div key={index} className="relative">
                      <video
                        src={video}
                        className="w-32 h-32 object-cover rounded-lg"
                        controls={false}
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingVideo(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Videos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('blogs.addNewVideos')} ({t('blogs.maxVideos')})
              </label>
              <div className="flex flex-wrap gap-4 mb-4">
                {videoPreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <video
                      src={preview}
                      className="w-32 h-32 object-cover rounded-lg"
                      controls={false}
                    />
                    <button
                      type="button"
                      onClick={() => removeNewVideo(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 w-fit">
                <VideoCameraIcon className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-700">{t('blogs.addVideos')}</span>
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleVideoChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('common.loading') : t('blogs.updatePost')}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/blog/${blogId}`)}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditBlog;

