import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FiTrash2, FiExternalLink, FiSearch, FiLayout, FiGrid, FiList, FiClock, FiFileText, FiImage, FiVideo } from 'react-icons/fi'

const MediaRegistry = () => {
    const { atoken, backendurl } = useContext(AdminContext)
    const [assets, setAssets] = useState([])
    const [loading, setLoading] = useState(true)
    const [nextCursor, setNextCursor] = useState(null)
    const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
    const [searchQuery, setSearchQuery] = useState('')

    const fetchAssets = async (cursor = null) => {
        try {
            setLoading(true)
            const { data } = await axios.get(`${backendurl}/api/admin/media-assets`, {
                params: { next_cursor: cursor, max_results: 18 },
                headers: { atoken }
            })
            if (data.success) {
                if (cursor) {
                    setAssets(prev => [...prev, ...data.assets])
                } else {
                    setAssets(data.assets)
                }
                setNextCursor(data.next_cursor)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error("Failed to load assets")
        } finally {
            setLoading(false)
        }
    }

    const deleteAsset = async (publicId) => {
        if (!window.confirm("Are you sure you want to delete this asset forever? This action cannot be undone.")) return

        try {
            const { data } = await axios.post(`${backendurl}/api/admin/delete-media`, { public_id: publicId }, { headers: { atoken } })
            if (data.success) {
                toast.success(data.message)
                setAssets(prev => prev.filter(a => a.public_id !== publicId))
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error("Deletion failed")
        }
    }

    useEffect(() => { if (atoken) fetchAssets() }, [atoken])

    const filteredAssets = assets.filter(a =>
        a.public_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.format.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
        <div className="p-5 md:p-8 max-w-[1600px] mx-auto min-h-screen bg-transparent">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        Media <span className="text-indigo-600">Registry</span>
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium italic">Inventory of all assets hosted on Cloudinary</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group/search">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search assets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 shadow-sm transition-all w-64 md:w-80"
                        />
                    </div>
                    <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <FiGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <FiList size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {loading && assets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-slate-500 font-bold animate-pulse">Syncing with Cloudinary CDN...</p>
                </div>
            ) : (
                <>
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                            {filteredAssets.map((asset) => (
                                <div key={asset.public_id} className="group relative bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                    {/* Aspect Ratio Box */}
                                    <div className="aspect-square bg-slate-50 relative overflow-hidden flex items-center justify-center">
                                        {asset.resource_type === 'image' ? (
                                            <img
                                                src={asset.secure_url.replace('/upload/', '/upload/c_fill,h_400,w_400/')}
                                                alt={asset.public_id}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                {asset.resource_type === 'video' ? <FiVideo size={48} className="text-indigo-400" /> : <FiFileText size={48} className="text-slate-400" />}
                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{asset.resource_type}</span>
                                            </div>
                                        )}

                                        {/* Quick Access Overlay */}
                                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                            <a href={asset.secure_url} target="_blank" rel="noreferrer" className="p-2.5 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors">
                                                <FiExternalLink size={18} />
                                            </a>
                                            <button
                                                onClick={() => deleteAsset(asset.public_id)}
                                                className="p-2.5 bg-rose-500/80 backdrop-blur-md rounded-full text-white hover:bg-rose-600 transition-colors"
                                            >
                                                <FiTrash2 size={18} />
                                            </button>
                                        </div>

                                        {/* Format Badge */}
                                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-[8px] font-black uppercase text-slate-700 shadow-sm border border-slate-100">
                                            {asset.format}
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="p-3">
                                        <p className="text-[10px] font-bold text-slate-700 truncate mb-1" title={asset.public_id}>
                                            {asset.public_id.split('/').pop()}
                                        </p>
                                        <div className="flex justify-between items-center text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                                            <span className="flex items-center gap-1"><FiLayout className="inline" /> {asset.width}x{asset.height}</span>
                                            <span className="px-1.5 py-0.5 bg-slate-50 rounded">{formatSize(asset.bytes)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <th className="px-6 py-4">Asset Preview</th>
                                        <th className="px-6 py-4">Public ID</th>
                                        <th className="px-6 py-4">Dimensions</th>
                                        <th className="px-6 py-4">Size</th>
                                        <th className="px-6 py-4">Uploaded</th>
                                        <th className="px-6 py-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredAssets.map(asset => (
                                        <tr key={asset.public_id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-3">
                                                <div className="w-12 h-12 rounded-lg bg-slate-50 overflow-hidden flex items-center justify-center">
                                                    {asset.resource_type === 'image' ? <img src={asset.secure_url} className="w-full h-full object-cover" /> : asset.resource_type === 'video' ? <FiVideo size={20} className="text-indigo-400" /> : <FiFileText size={20} className="text-slate-400" />}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <p className="text-xs font-bold text-slate-700 max-w-[200px] truncate">{asset.public_id}</p>
                                                <span className="text-[9px] text-indigo-500 font-black uppercase tracking-widest">{asset.format}</span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="text-[10px] font-medium text-slate-500">{asset.width} x {asset.height} px</span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="text-[10px] font-medium text-slate-500">{formatSize(asset.bytes)}</span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <FiClock className="text-slate-300" />
                                                    <span className="text-[10px] font-medium text-slate-500">{new Date(asset.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center justify-center gap-3">
                                                    <a href={asset.secure_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-500 transition-colors">
                                                        <FiExternalLink size={16} />
                                                    </a>
                                                    <button onClick={() => deleteAsset(asset.public_id)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                                        <FiTrash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Load More */}
                    {nextCursor && (
                        <div className="mt-12 flex justify-center">
                            <button
                                onClick={() => fetchAssets(nextCursor)}
                                disabled={loading}
                                className="px-8 py-3 bg-white border border-slate-200 rounded-full text-indigo-600 text-sm font-black shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50"
                            >
                                {loading ? "Discovering More..." : "Discover More Assets"}
                            </button>
                        </div>
                    )}

                    {filteredAssets.length === 0 && (
                        <div className="text-center py-24">
                            <div className="text-5xl mb-4 grayscale opacity-40">🔍</div>
                            <h3 className="text-xl font-bold text-slate-600 mb-1">No matches found</h3>
                            <p className="text-slate-400 text-sm">Try adjusting your filters or search terms</p>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default MediaRegistry
