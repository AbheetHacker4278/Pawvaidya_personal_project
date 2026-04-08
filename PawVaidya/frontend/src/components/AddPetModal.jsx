import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, PawPrint, Hash, User, Calendar, Shield } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { assets } from '../assets/assets_frontend/assets';

const AddPetModal = ({ isOpen, onClose, editPet = null }) => {
    const { addPet, updatePet, token } = useContext(AppContext);

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
                className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col"
                    style={{ maxHeight: '90vh' }}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                                <PawPrint className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-black text-[#5A4035]">
                                {editPet ? 'Edit Pet Profile' : 'Add New Pet'}
                            </h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                            <X className="w-6 h-6 text-gray-400" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-8 space-y-6">
                        {/* Image Upload */}
                        <div className="flex flex-col items-center">
                            <label className="relative group cursor-pointer">
                                <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-amber-50 shadow-inner bg-gray-50 flex items-center justify-center">
                                    {preview ? (
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <Upload className="w-8 h-8 text-amber-300" />
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[2rem]">
                                    <p className="text-white text-[10px] font-black uppercase tracking-widest">Change Image</p>
                                </div>
                                <input type="file" onChange={handleImageChange} className="hidden" accept="image/*" />
                            </label>
                            <p className="mt-3 text-[10px] font-black text-amber-600/50 uppercase tracking-widest">Pet Photo</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-black text-[#5A4035]/40 tracking-widest flex items-center gap-2">
                                    <User size={10} /> Pet Name
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-transparent focus:border-amber-400 focus:bg-white transition-all outline-none font-bold text-[#5A4035]"
                                    placeholder="e.g. Buddy"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-black text-[#5A4035]/40 tracking-widest flex items-center gap-2">
                                    <PawPrint size={10} /> Pet Type
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-transparent focus:border-amber-400 focus:bg-white transition-all outline-none font-bold text-[#5A4035] appearance-none"
                                >
                                    <option value="dog">Dog</option>
                                    <option value="cat">Cat</option>
                                    <option value="bird">Bird</option>
                                    <option value="rabbit">Rabbit</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-black text-[#5A4035]/40 tracking-widest flex items-center gap-2">
                                    <Hash size={10} /> Breed
                                </label>
                                <input
                                    type="text"
                                    value={formData.breed}
                                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-transparent focus:border-amber-400 focus:bg-white transition-all outline-none font-bold text-[#5A4035]"
                                    placeholder="e.g. Golden Retriever"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-black text-[#5A4035]/40 tracking-widest flex items-center gap-2">
                                    <Calendar size={10} /> Age (Years)
                                </label>
                                <input
                                    type="text"
                                    value={formData.age}
                                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-transparent focus:border-amber-400 focus:bg-white transition-all outline-none font-bold text-[#5A4035]"
                                    placeholder="e.g. 3"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-black text-[#5A4035]/40 tracking-widest flex items-center gap-2">
                                    <Shield size={10} /> Gender
                                </label>
                                <select
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-transparent focus:border-amber-400 focus:bg-white transition-all outline-none font-bold text-[#5A4035] appearance-none"
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-black text-[#5A4035]/40 tracking-widest flex items-center gap-2">
                                    <PawPrint size={10} /> Category
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-transparent focus:border-amber-400 focus:bg-white transition-all outline-none font-bold text-[#5A4035] appearance-none"
                                >
                                    <option value="Small Animal">Small Animal</option>
                                    <option value="Large Animal">Large Animal</option>
                                    <option value="Aquatic">Aquatic</option>
                                    <option value="Avian">Avian</option>
                                </select>
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full py-4 bg-[#5A4035] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#4a342b] transition-all shadow-xl shadow-amber-900/10 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : editPet ? 'Update Pet' : 'Register Pet'}
                        </button>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AddPetModal;
