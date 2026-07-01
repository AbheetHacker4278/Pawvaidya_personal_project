import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, PawPrint, Hash, User, Calendar, Shield, Sparkles, ShieldCheck, ChevronDown, Check } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { assets } from '../assets/assets_frontend/assets';

const AddPetModal = ({ isOpen, onClose, editPet = null }) => {
    const { addPet, updatePet, token, userdata } = useContext(AppContext);

    const isObsidian = userdata?.subscription?.status === 'Active' && userdata?.subscription?.plan === 'Obsidian';

    const [formData, setFormData] = useState({
        name: '',
        type: 'dog',
        breed: '',
        age: '1',
        gender: 'Male',
        category: 'Small Animal'
    });
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (editPet) {
            setFormData({
                name: editPet.name || '',
                type: editPet.type || 'dog',
                breed: editPet.breed || '',
                age: editPet.age || '1',
                gender: editPet.gender || 'Male',
                category: editPet.category || 'Small Animal'
            });
            setPreview(editPet.image || null);
        } else {
            setFormData({
                name: '',
                type: 'dog',
                breed: '',
                age: '1',
                gender: 'Male',
                category: 'Small Animal'
            });
            setPreview(null);
            setImage(null);
        }
    }, [editPet, isOpen]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        data.append('name', formData.name);
        data.append('type', formData.type);
        data.append('breed', formData.breed);
        data.append('age', formData.age);
        data.append('gender', formData.gender);
        data.append('category', formData.category);
        if (image) data.append('image', image);
        if (editPet) data.append('petId', editPet._id);

        const success = editPet ? await updatePet(data) : await addPet(data);

        if (success) {
            onClose();
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className={`rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col border ${
                        isObsidian 
                            ? 'bg-[#0E0E0E] border-[#E6C97A]/25 text-white shadow-[0_25px_60px_rgba(0,0,0,0.85)]' 
                            : 'bg-white border-gray-100'
                    }`}
                    style={{ maxHeight: '92vh' }}
                >
                    {/* Header */}
                    <div className={`p-6 flex items-center justify-between sticky top-0 z-10 border-b ${
                        isObsidian 
                            ? 'bg-[#0E0E0E] border-zinc-800/80' 
                            : 'bg-white border-gray-100'
                    }`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                                isObsidian 
                                    ? 'bg-[#E6C97A]/10 border-[#E6C97A]/30 text-[#E6C97A]' 
                                    : 'bg-amber-50 border-transparent text-amber-600'
                            }`}>
                                <PawPrint className="w-6 h-6 fill-current" />
                            </div>
                            <div>
                                <h2 className={`text-xl font-black ${isObsidian ? 'text-white' : 'text-[#5A4035]'}`}>
                                    {editPet ? 'Edit Pet Profile' : 'Add New Pet'}
                                </h2>
                                <p className={`text-[11px] font-medium ${isObsidian ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                    Add your furry friend to your family
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            className={`p-2 rounded-xl transition-colors border ${
                                isObsidian 
                                    ? 'bg-black/40 border-zinc-800 text-neutral-400 hover:text-white hover:bg-zinc-900' 
                                    : 'hover:bg-gray-100 text-gray-400 border-transparent'
                            }`}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-8 space-y-6 relative">
                        {isObsidian && (
                            /* Background decorative watermarks */
                            <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
                                <div className="absolute top-12 left-8 text-[#E6C97A]">
                                    <PawPrint size={100} className="fill-current" />
                                </div>
                                <div className="absolute bottom-16 right-6 text-[#E6C97A]">
                                    <PawPrint size={120} className="fill-current" />
                                </div>
                                <div className="absolute top-1/3 right-1/4 text-[#E6C97A]">
                                    <Sparkles size={40} className="fill-current" />
                                </div>
                            </div>
                        )}

                        {/* Image Upload */}
                        <div className="flex flex-col items-center relative z-10">
                            <label className="relative group cursor-pointer w-full max-w-[280px]">
                                <div className={`aspect-[1.3/1] rounded-[2rem] overflow-hidden border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all ${
                                    isObsidian 
                                        ? 'border-[#E6C97A]/35 bg-[#151515]/60 hover:border-[#E6C97A] hover:bg-[#151515]' 
                                        : 'border-amber-300 bg-gray-50 hover:border-amber-400'
                                }`}>
                                    {preview ? (
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                                isObsidian ? 'bg-[#E6C97A]/10 text-[#E6C97A]' : 'bg-amber-50 text-amber-500'
                                            }`}>
                                                <Upload className="w-6 h-6" />
                                            </div>
                                            <span className={`text-sm font-bold ${isObsidian ? 'text-white' : 'text-[#5A4035]'}`}>
                                                Upload Photo
                                            </span>
                                            <span className={`text-[10px] ${isObsidian ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                                JPG, PNG up to 5MB
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {preview && (
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[2rem]">
                                        <p className="text-white text-[10px] font-black uppercase tracking-widest">Change Image</p>
                                    </div>
                                )}
                                <input type="file" onChange={handleImageChange} className="hidden" accept="image/*" />
                            </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
                            {/* Pet Name */}
                            <div className="space-y-1.5">
                                <label className={`text-[10px] uppercase font-black tracking-widest flex items-center gap-1.5 ${
                                    isObsidian ? 'text-[#E6C97A]' : 'text-[#5A4035]/40'
                                }`}>
                                    <User size={12} /> Pet Name
                                </label>
                                <div className="relative">
                                    {isObsidian && (
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#E6C97A] opacity-80">
                                            <PawPrint size={14} className="fill-current" />
                                        </div>
                                    )}
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className={`w-full py-3.5 rounded-2xl border transition-all outline-none font-bold ${
                                            isObsidian 
                                                ? 'pl-11 pr-5 bg-[#151515] border-zinc-800/80 focus:border-[#E6C97A] text-white focus:bg-[#151515]' 
                                                : 'px-5 bg-gray-50 border-transparent focus:border-amber-400 focus:bg-white text-[#5A4035]'
                                        }`}
                                        placeholder="e.g. Buddy"
                                    />
                                </div>
                            </div>

                            {/* Pet Type */}
                            <div className="space-y-1.5">
                                <label className={`text-[10px] uppercase font-black tracking-widest flex items-center gap-1.5 ${
                                    isObsidian ? 'text-[#E6C97A]' : 'text-[#5A4035]/40'
                                }`}>
                                    <PawPrint size={12} /> Pet Type
                                </label>
                                <div className="relative">
                                    {isObsidian && (
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#E6C97A]/90 font-bold text-sm">
                                            🐶
                                        </div>
                                    )}
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className={`w-full py-3.5 rounded-2xl border transition-all outline-none font-bold appearance-none ${
                                            isObsidian 
                                                ? 'pl-11 pr-10 bg-[#151515] border-zinc-800/80 focus:border-[#E6C97A] text-white focus:bg-[#151515]' 
                                                : 'px-5 bg-gray-50 border-transparent focus:border-amber-400 focus:bg-white text-[#5A4035]'
                                        }`}
                                    >
                                        <option value="dog">Dog</option>
                                        <option value="cat">Cat</option>
                                        <option value="bird">Bird</option>
                                        <option value="rabbit">Rabbit</option>
                                        <option value="other">Other</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                        <ChevronDown size={16} />
                                    </div>
                                </div>
                            </div>

                            {/* Breed */}
                            <div className="space-y-1.5">
                                <label className={`text-[10px] uppercase font-black tracking-widest flex items-center gap-1.5 ${
                                    isObsidian ? 'text-[#E6C97A]' : 'text-[#5A4035]/40'
                                }`}>
                                    <Hash size={12} /> Breed
                                </label>
                                <div className="relative">
                                    {isObsidian && (
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#E6C97A] opacity-80">
                                            <PawPrint size={14} className="fill-current" />
                                        </div>
                                    )}
                                    <input
                                        type="text"
                                        value={formData.breed}
                                        onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                                        className={`w-full py-3.5 rounded-2xl border transition-all outline-none font-bold ${
                                            isObsidian 
                                                ? 'pl-11 pr-5 bg-[#151515] border-zinc-800/80 focus:border-[#E6C97A] text-white focus:bg-[#151515]' 
                                                : 'px-5 bg-gray-50 border-transparent focus:border-amber-400 focus:bg-white text-[#5A4035]'
                                        }`}
                                        placeholder="e.g. Golden Retriever"
                                    />
                                </div>
                            </div>

                            {/* Age */}
                            <div className="space-y-1.5">
                                <label className={`text-[10px] uppercase font-black tracking-widest flex items-center gap-1.5 ${
                                    isObsidian ? 'text-[#E6C97A]' : 'text-[#5A4035]/40'
                                }`}>
                                    <Calendar size={12} /> Age (Years)
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.age}
                                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                        className={`w-full py-3.5 rounded-2xl border transition-all outline-none font-bold ${
                                            isObsidian 
                                                ? 'px-5 bg-[#151515] border-zinc-800/80 focus:border-[#E6C97A] text-white focus:bg-[#151515]' 
                                                : 'px-5 bg-gray-50 border-transparent focus:border-amber-400 focus:bg-white text-[#5A4035]'
                                        }`}
                                        placeholder="e.g. 3"
                                    />
                                    {isObsidian && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#E6C97A]">
                                            <Calendar size={16} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Gender */}
                            <div className="space-y-1.5">
                                <label className={`text-[10px] uppercase font-black tracking-widest flex items-center gap-1.5 ${
                                    isObsidian ? 'text-[#E6C97A]' : 'text-[#5A4035]/40'
                                }`}>
                                    <Shield size={12} /> Gender
                                </label>
                                {isObsidian ? (
                                    /* Dual Gender selection buttons like in mockup */
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, gender: 'Male' })}
                                            className={`py-3.5 rounded-2xl border font-bold flex items-center justify-center gap-2 transition-all ${
                                                formData.gender === 'Male'
                                                    ? 'border-[#E6C97A] bg-[#E6C97A]/10 text-white'
                                                    : 'border-zinc-800 bg-[#151515] text-neutral-400 hover:text-white hover:bg-zinc-900'
                                            }`}
                                        >
                                            <span className="text-[#E6C97A] text-base">♂</span> Male
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, gender: 'Female' })}
                                            className={`py-3.5 rounded-2xl border font-bold flex items-center justify-center gap-2 transition-all ${
                                                formData.gender === 'Female'
                                                    ? 'border-[#E6C97A] bg-[#E6C97A]/10 text-white'
                                                    : 'border-zinc-800 bg-[#151515] text-neutral-400 hover:text-white hover:bg-zinc-900'
                                            }`}
                                        >
                                            <span className="text-pink-400 text-base">♀</span> Female
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <select
                                            value={formData.gender}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                            className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-transparent focus:border-amber-400 focus:bg-white transition-all outline-none font-bold text-[#5A4035] appearance-none"
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Category */}
                            <div className="space-y-1.5">
                                <label className={`text-[10px] uppercase font-black tracking-widest flex items-center gap-1.5 ${
                                    isObsidian ? 'text-[#E6C97A]' : 'text-[#5A4035]/40'
                                }`}>
                                    <PawPrint size={12} /> Category
                                </label>
                                <div className="relative">
                                    {isObsidian && (
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#E6C97A] opacity-80">
                                            <PawPrint size={14} className="fill-current" />
                                        </div>
                                    )}
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className={`w-full py-3.5 rounded-2xl border transition-all outline-none font-bold appearance-none ${
                                            isObsidian 
                                                ? 'pl-11 pr-10 bg-[#151515] border-zinc-800/80 focus:border-[#E6C97A] text-white focus:bg-[#151515]' 
                                                : 'px-5 bg-gray-50 border-transparent focus:border-amber-400 focus:bg-white text-[#5A4035]'
                                        }`}
                                    >
                                        <option value="Small Animal">Small Animal</option>
                                        <option value="Large Animal">Large Animal</option>
                                        <option value="Aquatic">Aquatic</option>
                                        <option value="Avian">Avian</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                        <ChevronDown size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2 relative z-10">
                            {isObsidian ? (
                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 text-black bg-gradient-to-r from-[#8C6D23] via-[#E6C97A] to-[#8C6D23] hover:brightness-110 active:scale-[0.99] border border-[#E6C97A]/40"
                                >
                                    <Sparkles size={14} className="fill-current" />
                                    <PawPrint size={16} className="fill-current" />
                                    <span>{loading ? 'Saving...' : editPet ? 'UPDATE PET' : 'REGISTER PET'}</span>
                                    <Sparkles size={14} className="fill-current" />
                                </button>
                            ) : (
                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full py-4 bg-[#5A4035] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#4a342b] transition-all shadow-xl shadow-amber-900/10 disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : editPet ? 'Update Pet' : 'Register Pet'}
                                </button>
                            )}
                        </div>

                        {/* Secure Sub-footer */}
                        <div className="flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-neutral-500">
                            <ShieldCheck size={14} className={isObsidian ? 'text-[#E6C97A]' : 'text-[#5A4035]/50'} />
                            <span>Your pet's data is secure and private</span>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AddPetModal;
