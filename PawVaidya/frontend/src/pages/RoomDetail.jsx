import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, ArrowLeftIcon, LockClosedIcon, PlusIcon, PhotoIcon, VideoCameraIcon, XMarkIcon } from '@heroicons/react/24/outline';
import RunningDogLoader from '../components/RunningDogLoader';

// We will fetch blogs and render them here. For brevity, we could just render a scaled down feed.
// But to match the Pawvaidya theme, we need the B palette again.
const B = {
    dark: '#3d2b1f',
    mid: '#5A4035',
    light: '#7a5a48',
    cream: '#f2e4c7',
    sand: '#e8d5b0',
    amber: '#c8860a',
    pale: '#fdf8f0',
};

const RoomDetail = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { token, userdata, backendurl } = useContext(AppContext);

    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMember, setIsMember] = useState(false);
    const [isOwner, setIsOwner] = useState(false);

    const [blogs, setBlogs] = useState([]);
    const [blogsLoading, setBlogsLoading] = useState(false);

    const [managementData, setManagementData] = useState(null);
    const [showManage, setShowManage] = useState(false);

    // Inline Post Creator State
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [submittingPost, setSubmittingPost] = useState(false);
    const [postForm, setPostForm] = useState({ title: '', content: '', tags: '' });
    const [images, setImages] = useState([]);
    const [videos, setVideos] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [videoPreviews, setVideoPreviews] = useState([]);

    useEffect(() => {
        fetchRoomDetails();
    }, [roomId, token, userdata]);

    const fetchRoomDetails = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${backendurl}/api/rooms/${roomId}`);
            if (data.success) {
                const r = data.room;
                setRoom(r);

                if (userdata) {
                    const owner = r.ownerId === userdata.id;
                    setIsOwner(owner);
                    setIsMember(owner || r.members?.some(m => m.userId === userdata.id));
                }
            } else {
                toast.error(data.message);
                navigate('/community-blogs');
            }
        } catch (error) {
            toast.error('Error fetching room details');
            navigate('/community-blogs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isMember) {
            fetchRoomBlogs();
        }
        if (isOwner && showManage) {
            fetchManagementData();
        }
    }, [isMember, isOwner, showManage]);

    const fetchRoomBlogs = async () => {
        try {
            setBlogsLoading(true);
            const { data } = await axios.get(`${backendurl}/api/user/blogs?roomId=${roomId}`);
            if (data.success) {
                setBlogs(data.blogs);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setBlogsLoading(false);
        }
    };

    const fetchManagementData = async () => {
        try {
            const { data } = await axios.get(`${backendurl}/api/rooms/${roomId}/manage`, {
                headers: { token },
                params: { userId: userdata.id } // Send userId in params or body depending on setup
            });
            // The controller actually expects userId in req.body for GET which is bad practice, let's fix that if needed.
            // Wait, axios GET doesn't easily send body. Let's send a special POST request or pass token.
            // Since we use `authUser` middleware, `req.body.userId` is populated by the token!
            const mgmtRes = await axios.get(`${backendurl}/api/rooms/${roomId}/manage`, { headers: { token } });

            if (mgmtRes.data.success) {
                setManagementData(mgmtRes.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleRequestJoin = async () => {
        if (!token) return toast.error('Please login to request joining a room');
        try {
            const { data } = await axios.post(`${backendurl}/api/rooms/${roomId}/request`,
                { userId: userdata.id },
                { headers: { token } });

            if (data.success) {
                toast.success('Join request sent!');
                fetchRoomDetails();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error sending request');
        }
    };

    const handleDeleteRoom = async () => {
        if (!window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) return;
        try {
            const { data } = await axios.delete(`${backendurl}/api/rooms/${roomId}`, { headers: { token } });
            if (data.success) {
                toast.success('Room deleted successfully');
                navigate('/community-blogs');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete room');
        }
    };

    const handleRequestAction = async (targetUserId, action) => {
        try {
            const endpoint = action === 'approve' ? 'approve' : 'reject';
            const { data } = await axios.post(`${backendurl}/api/rooms/${roomId}/${endpoint}`,
                { targetUserId },
                { headers: { token } });

            if (data.success) {
                toast.success(`Request ${action}d`);
                fetchManagementData();
                fetchRoomDetails();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || `Error ${action}ing request`);
        }
    };

    // Inline Post Creator Handlers
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + images.length > 5) return toast.error('Maximum 5 images allowed');
        const newImages = []; const newPreviews = [];
        files.forEach(file => {
            if (file.size > 10 * 1024 * 1024) return toast.error(`${file.name} is too large (max 10MB)`);
            newImages.push(file);
            const reader = new FileReader();
            reader.onload = (ev) => {
                newPreviews.push(ev.target.result);
                if (newPreviews.length === files.length) setImagePreviews(prev => [...prev, ...newPreviews]);
            };
            reader.readAsDataURL(file);
        });
        setImages(prev => [...prev, ...newImages]);
    };

    const handleVideoChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + videos.length > 3) return toast.error('Maximum 3 videos allowed');
        const newVideos = []; const newPreviews = [];
        files.forEach(file => {
            if (file.size > 50 * 1024 * 1024) return toast.error(`${file.name} is too large (max 50MB)`);
            newVideos.push(file);
            const reader = new FileReader();
            reader.onload = (ev) => {
                newPreviews.push(ev.target.result);
                if (newPreviews.length === files.length) setVideoPreviews(prev => [...prev, ...newPreviews]);
            };
            reader.readAsDataURL(file);
        });
        setVideos(prev => [...prev, ...newVideos]);
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!postForm.title.trim() || !postForm.content.trim()) return toast.error('Title and content are required');

        try {
            setSubmittingPost(true);
            const data = new FormData();
            data.append('userId', userdata.id);
            data.append('roomId', roomId);
            data.append('title', postForm.title);
            data.append('content', postForm.content);
            data.append('tags', JSON.stringify(postForm.tags.split(',').map(tag => tag.trim()).filter(Boolean)));

            images.forEach(img => data.append('images', img));
            videos.forEach(vid => data.append('videos', vid));

            const res = await axios.post(`${backendurl}/api/user/blogs/create`, data, {
                headers: { token, 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                toast.success('Posted successfully pending refresh');
                // Reset form
                setPostForm({ title: '', content: '', tags: '' });
                setImages([]); setVideos([]); setImagePreviews([]); setVideoPreviews([]);
                setShowCreatePost(false);
                fetchRoomBlogs(); // Refresh feed
            } else {
                toast.error(res.data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create post');
        } finally {
            setSubmittingPost(false);
        }
    };

    const handleDeletePost = async (e, blogId) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this post?')) return;

        try {
            const { data } = await axios.delete(`${backendurl}/api/user/blogs/${blogId}`, {
                headers: { token },
                data: { userId: userdata.id }
            });
            if (data.success) {
                toast.success('Post deleted');
                setBlogs(blogs.filter(b => b._id !== blogId));
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete post');
        }
    };

    if (loading) return <div className="py-24"><RunningDogLoader /></div>;
    if (!room) return null;

    return (
        <div className="min-h-screen pb-12" style={{ background: B.cream }}>
            {/* ── Header ──────────────────────────────────────────────────────── */}
            <div className="pt-8 pb-12 px-4 shadow-sm relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${B.dark} 0%, ${B.mid} 100%)` }}>
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <div className="max-w-4xl mx-auto relative z-10">
                    <button onClick={() => navigate('/community-blogs')} className="flex items-center gap-2 text-white/80 hover:text-white mb-6 text-sm font-bold transition-colors">
                        <ArrowLeftIcon className="w-4 h-4" /> Back to Hub
                    </button>

                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl md:text-4xl font-bold text-white">{room.name}</h1>
                        {room.isPrivate && <LockClosedIcon className="w-6 h-6 text-amber-400" />}
                    </div>

                    <p className="text-white/80 text-lg mb-4">{room.description}</p>

                    <div className="flex items-center gap-4 text-sm mt-4 text-white/90">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-400"></span>
                            <span className="font-semibold">{room.memberCount} Members</span>
                        </div>
                        {isOwner && (
                            <div className="flex items-center gap-3">
                                <button onClick={() => setShowManage(!showManage)} className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl font-bold transition-colors">
                                    {showManage ? 'View Feed' : 'Manage Room'}
                                </button>
                                <button onClick={handleDeleteRoom} className="px-4 py-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-xl font-bold transition-colors shadow-sm">
                                    Delete Room
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Body ───────────────────────────────────────────────────────── */}
            <div className="max-w-4xl mx-auto px-4 mt-8">
                {!token ? (
                    <div className="bg-white p-8 rounded-2xl text-center shadow-sm" style={{ border: `1px solid ${B.sand}` }}>
                        <LockClosedIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <h2 className="text-xl font-bold mb-2">Private Room</h2>
                        <p className="text-gray-500 mb-6">You must be logged in to view or request to join this room.</p>
                        <button onClick={() => navigate('/login-form')} className="px-6 py-2.5 bg-amber-600 text-white rounded-xl font-bold">Log In</button>
                    </div>
                ) : !isMember ? (
                    <div className="bg-white p-8 rounded-2xl text-center shadow-sm" style={{ border: `1px solid ${B.sand}` }}>
                        <LockClosedIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <h2 className="text-xl font-bold mb-2" style={{ color: B.dark }}>Private Community Room</h2>
                        <p className="mb-6 font-medium max-w-md mx-auto" style={{ color: B.mid }}>The contents of this room are restricted to members only. Send a request to the owner to join.</p>

                        {room.pendingRequests?.some(p => p.userId === userdata.id) ? (
                            <div className="inline-block px-6 py-3 bg-amber-50 text-amber-700 rounded-xl font-bold border border-amber-200">
                                Join Request Pending...
                            </div>
                        ) : (
                            <button onClick={handleRequestJoin} className="px-6 py-3 rounded-xl font-bold text-white shadow-md transition-transform hover:scale-105" style={{ background: `linear-gradient(135deg, ${B.mid}, ${B.amber})` }}>
                                Request to Join
                            </button>
                        )}
                    </div>
                ) : showManage && isOwner ? (
                    /* ── Management Console ────────────────────────────────────── */
                    <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: `1px solid ${B.sand}` }}>
                        <h2 className="text-xl font-bold mb-6" style={{ color: B.dark }}>Room Management</h2>

                        <div className="mb-8">
                            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">Pending Requests <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs">{managementData?.pendingRequests?.length || 0}</span></h3>
                            {managementData?.pendingRequests?.length > 0 ? (
                                <div className="grid gap-3">
                                    {managementData.pendingRequests.map(req => (
                                        <div key={req.userId} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
                                            <div className="flex items-center gap-3 mb-3 sm:mb-0">
                                                <img src={req.userData?.image || assets.profile_pic} className="w-10 h-10 rounded-full" />
                                                <div>
                                                    <p className="font-bold text-gray-900">{req.userData?.name}</p>
                                                    <p className="text-xs text-gray-500">{req.userData?.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleRequestAction(req.userId, 'reject')} className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                                                    <XCircleIcon className="w-5 h-5" /> Reject
                                                </button>
                                                <button onClick={() => handleRequestAction(req.userId, 'approve')} className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                                                    <CheckCircleIcon className="w-5 h-5" /> Approve
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No pending requests.</p>
                            )}
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-700 mb-4">Current Members</h3>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {managementData?.members?.map(mem => (
                                    <div key={mem.userId} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                                        <img src={mem.userData?.image || assets.profile_pic} className="w-8 h-8 rounded-full" />
                                        <div>
                                            <p className="font-bold text-sm text-gray-900">{mem.userData?.name} {mem.userId === room.ownerId && <span className="text-xs text-amber-600 ml-1 font-semibold">(Owner)</span>}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ── Room Feed ──────────────────────────────────────────────── */
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold" style={{ color: B.dark }}>Room Feed</h2>
                            <button
                                onClick={() => setShowCreatePost(!showCreatePost)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white shadow-md text-sm transition-transform hover:scale-105"
                                style={{ background: showCreatePost ? '#9ca3af' : B.amber }}
                            >
                                {showCreatePost ? <XMarkIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
                                {showCreatePost ? 'Cancel' : 'New Post'}
                            </button>
                        </div>

                        {/* ── Inline Post Creator ────────────────────────────────────── */}
                        <AnimatePresence>
                            {showCreatePost && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                                    className="mb-8 overflow-hidden"
                                >
                                    <div className="bg-white rounded-2xl p-6 shadow-md border-2" style={{ borderColor: B.amber }}>
                                        <h3 className="font-bold text-lg mb-4" style={{ color: B.dark }}>Create a Room Post</h3>
                                        <form onSubmit={handleCreatePost} className="space-y-4">
                                            <input
                                                required type="text" placeholder="Post Title"
                                                value={postForm.title} onChange={e => setPostForm({ ...postForm, title: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border focus:border-amber-400 focus:outline-none transition-colors"
                                                style={{ borderColor: B.sand }}
                                            />
                                            <textarea
                                                required rows="4" placeholder="What do you want to share with this room?"
                                                value={postForm.content} onChange={e => setPostForm({ ...postForm, content: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border focus:border-amber-400 focus:outline-none transition-colors resize-y"
                                                style={{ borderColor: B.sand }}
                                            ></textarea>
                                            <input
                                                type="text" placeholder="Tags (comma separated, e.g. question, advice, pics)"
                                                value={postForm.tags} onChange={e => setPostForm({ ...postForm, tags: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl border focus:border-amber-400 focus:outline-none transition-colors text-sm"
                                                style={{ borderColor: B.sand }}
                                            />

                                            {/* Media Previews */}
                                            {(imagePreviews.length > 0 || videoPreviews.length > 0) && (
                                                <div className="flex flex-wrap gap-3 py-2 border-t mt-4" style={{ borderColor: B.sand }}>
                                                    {imagePreviews.map((src, i) => (
                                                        <div key={`img-${i}`} className="relative group">
                                                            <img src={src} className="w-20 h-20 object-cover rounded-lg border" />
                                                            <button type="button" onClick={() => { setImages(images.filter((_, idx) => idx !== i)); setImagePreviews(imagePreviews.filter((_, idx) => idx !== i)); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><XMarkIcon className="w-3 h-3" /></button>
                                                        </div>
                                                    ))}
                                                    {videoPreviews.map((src, i) => (
                                                        <div key={`vid-${i}`} className="relative group">
                                                            <video src={src} className="w-20 h-20 object-cover rounded-lg border" />
                                                            <button type="button" onClick={() => { setVideos(videos.filter((_, idx) => idx !== i)); setVideoPreviews(videoPreviews.filter((_, idx) => idx !== i)); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><XMarkIcon className="w-3 h-3" /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                                                <div className="flex gap-2">
                                                    <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer hover:bg-gray-50 text-sm font-semibold transition-colors text-gray-600" style={{ borderColor: B.sand }}>
                                                        <PhotoIcon className="w-5 h-5" /> Image
                                                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                                                    </label>
                                                    <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer hover:bg-gray-50 text-sm font-semibold transition-colors text-gray-600" style={{ borderColor: B.sand }}>
                                                        <VideoCameraIcon className="w-5 h-5" /> Video
                                                        <input type="file" multiple accept="video/*" className="hidden" onChange={handleVideoChange} />
                                                    </label>
                                                </div>
                                                <button type="submit" disabled={submittingPost} className="px-6 py-2 rounded-xl font-bold text-white shadow-md disabled:opacity-50 transition-colors" style={{ background: B.amber }}>
                                                    {submittingPost ? 'Posting...' : 'Post'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {blogsLoading ? (
                            <div className="py-12"><RunningDogLoader /></div>
                        ) : blogs.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl shadow-sm" style={{ border: `1px solid ${B.sand}` }}>
                                <p className="text-lg font-bold text-gray-800">No posts yet!</p>
                                <p className="text-gray-500">Break the ice and share something with the room.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {blogs.map(blog => (
                                    <div key={blog._id} onClick={() => navigate(`/blog/${blog._id}`)} className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-shadow relative" style={{ border: `1px solid ${B.sand}` }}>
                                        <div className="flex items-center gap-3 mb-3">
                                            <img src={blog.userImage || assets.profile_pic} className="w-8 h-8 rounded-full" />
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-900">{blog.userName}</h4>
                                                <p className="text-xs text-gray-500">{new Date(blog.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        {isOwner && (
                                            <button
                                                onClick={(e) => handleDeletePost(e, blog._id)}
                                                className="absolute top-5 right-5 text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <XMarkIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                        <h3 className="text-lg font-bold mb-2 text-gray-800 line-clamp-2 pr-8">{blog.title}</h3>
                                        <p className="text-sm text-gray-600 line-clamp-3 mb-4">{blog.content}</p>

                                        <div className="flex items-center gap-4 text-sm font-semibold text-gray-400">
                                            <span>🐾 {blog.likes?.length || 0} Likes</span>
                                            <span>💬 {blog.comments?.length || 0} Comments</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoomDetail;
