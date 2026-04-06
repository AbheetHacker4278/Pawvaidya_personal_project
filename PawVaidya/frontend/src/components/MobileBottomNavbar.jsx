import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, FileText, Syringe, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

const MobileBottomNavbar = () => {
    const location = useLocation();

    const navItems = [
        { icon: <ShieldAlert size={20} />, path: '/report-issue', label: 'Support' },
        { icon: <Calendar size={20} />, path: '/my-appointments', label: 'Appointments' },
        { icon: <Home size={22} />, path: '/', label: 'Home' },
        { icon: <FileText size={20} />, path: '/my-pets', label: 'Pets' },
        { icon: <Syringe size={20} />, path: '/doctors', label: 'Medical' },
    ];

    // Colors based on brand palette
    const COLORS = {
        bg: '#3d2b1f',
        inactive: '#a89080',
        active: '#ffff00', // Bright Yellow as seen in image
    };

    // Hide on desktop
    const isMobileView = 'md:hidden';

    return (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-fit ${isMobileView}`}>
            <nav
                className="relative flex items-center justify-center gap-2 px-6 py-2 rounded-full shadow-2xl backdrop-blur-md"
                style={{
                    backgroundColor: COLORS.bg,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
                }}
            >
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className="relative flex flex-col items-center justify-center w-12 h-12 transition-all duration-300"
                        >
                            <motion.div
                                animate={{
                                    color: isActive ? COLORS.active : COLORS.inactive,
                                    scale: isActive ? 1.1 : 1
                                }}
                                className="z-10"
                            >
                                {item.icon}
                            </motion.div>

                            {isActive && (
                                <motion.div
                                    layoutId="activeTabMobile"
                                    className="absolute -bottom-1 w-6 h-1 rounded-full"
                                    style={{ backgroundColor: COLORS.active }}
                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                />
                            )}
                        </NavLink>
                    );
                })}
            </nav>
        </div>
    );
};

export default MobileBottomNavbar;
