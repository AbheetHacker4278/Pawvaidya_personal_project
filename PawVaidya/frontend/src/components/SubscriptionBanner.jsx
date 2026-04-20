import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Zap, Heart } from 'lucide-react';

const SubscriptionBanner = () => {
    const navigate = useNavigate();

    return (
        <section className="px-3 sm:px-4 py-12 relative overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="max-w-6xl mx-auto rounded-[3rem] p-8 md:p-12 relative overflow-hidden shadow-2xl border border-white/20"
                style={{
                    background: 'linear-gradient(135deg, #1c1917 0%, #44403c 100%)',
                }}
            >
                {/* Background Textures */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl -ml-20 -mb-20" />

                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                    <div className="max-w-2xl text-center lg:text-left">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-widest mb-6"
                        >
                            <Sparkles className="w-4 h-4" />
                            Premium Care for Pets
                        </motion.div>

                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-6 tracking-tight">
                            Elevate Your Pet's <span className="text-amber-400">Care Experience</span>
                        </h2>

                        <p className="text-stone-400 text-lg md:text-xl font-medium leading-relaxed mb-8">
                            Unlock priority bookings, unlimited consultations, and 24/7 emergency support.
                            Choose a <span className="text-white font-bold">PawPlan</span> that fits your pet's needs.
                        </p>

                        <div className="flex flex-wrap justify-center lg:justify-start gap-6 mb-10">
                            {[
                                { icon: ShieldCheck, text: "Priority Booking" },
                                { icon: Zap, text: "Exclusive Discounts" },
                                { icon: Heart, text: "24/7 Support" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-stone-300">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                        <item.icon className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <span className="text-sm font-bold">{item.text}</span>
                                </div>
                            ))}
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/subscription')}
                            className="group flex items-center gap-3 px-10 py-5 bg-amber-500 hover:bg-amber-400 text-stone-900 rounded-2xl font-black text-lg transition-all shadow-xl shadow-amber-500/20"
                        >
                            Explore PawPlans
                            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                    </div>

                    {/* Visual Element */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative w-full max-w-sm lg:max-w-md aspect-square rounded-[3rem] overflow-hidden group shadow-2xl"
                    >
                        <img
                            src="https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=800"
                            alt="Premium Pet Care"
                            className="w-full h-full object-cover grayscale opacity-60 group-hover:scale-110 group-hover:grayscale-0 transition-all duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent" />

                        {/* Floating elements */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute top-10 left-10 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-2xl"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                                <span className="text-xs font-black uppercase tracking-widest">Active Platinum Care</span>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </motion.div>
        </section>
    );
};

export default SubscriptionBanner;
