import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { PhotoIcon, VideoCameraIcon, XMarkIcon } from '@heroicons/react/24/outline';

const CreateBlog = () => {
  const { t } = useTranslation();
  const { token, userdata, backendurl } = useContext(AppContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: ''
  });
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);

  React.useEffect(() => {
    if (!token || !userdata) {
      toast.error('Please login to create a blog post');
      navigate('/login-form');
      return;
    }
    
    // Check if user is banned
    if (userdata.isBanned) {
      toast.error('Your account is banned. You cannot create blog posts.');
      navigate('/');
    }
  }, [token, userdata, navigate]);

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
    if (files.length + videos.length > 3) {
      toast.error('Maximum 3 videos allowed');
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
      const data = new FormData();
      data.append('userId', userdata.id);
      data.append('title', formData.title);
      data.append('content', formData.content);
      data.append('tags', JSON.stringify(
        formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      ));

      images.forEach((image, index) => {
        data.append('images', image);
      });

      videos.forEach((video, index) => {
        data.append('videos', video);
      });

      const { data: response } = await axios.post(
        `${backendurl}/api/user/blogs/create`,
        data,
        {
          headers: {
            token,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.success) {
        toast.success('Blog post created successfully!');
        navigate('/community-blogs');
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create blog post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: '#f2e4c7' }}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('blogs.createBlog')}</h1>

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

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('blogs.images')} ({t('blogs.maxImages')})
              </label>
              <div className="flex flex-wrap gap-4 mb-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
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

            {/* Videos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('blogs.videos')} ({t('blogs.maxVideos')})
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
                      onClick={() => removeVideo(index)}
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
                {loading ? t('common.loading') : t('blogs.createPostBtn')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/community-blogs')}
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

export default CreateBlog;

