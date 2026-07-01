import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, FileText, Syringe, LifeBuoy } from 'lucide-react';
import { motion } from 'framer-motion';
import { AppContext } from '../context/AppContext';

// Custom Diamond Icon matching the premium mockup design
const DiamondIcon = ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 2L2 12l10 10 10-10z" />
        <path d="M12 7l-5 5 5 5 5-5z" />
    </svg>
);

const MobileBottomNavbar = () => {
    const location = useLocation();
    const { userdata, token } = useContext(AppContext);

    const activePlan = userdata?.subscription?.status === 'Active' ? userdata?.subscription?.plan : 'None';
    const isObsidian = activePlan === 'Obsidian' && token;

    const navItems = [
        { 
            icon: isObsidian ? <DiamondIcon size={20} /> : <LifeBuoy size={20} />, 
            path: '/support', 
            label: 'Support' 
        },
        { icon: <Calendar size={20} />, path: '/my-appointments', label: 'Appointments' },
        { icon: <Home size={22} />, path: '/', label: 'Home' },
        { icon: <FileText size={20} />, path: '/my-pets', label: 'Pets' },
        { icon: <Syringe size={20} />, path: '/doctors', label: 'Medical' },
    ];

    // Colors based on brand palette
    const COLORS = {
        bg: isObsidian ? 'linear-gradient(135deg, rgba(20, 20, 20, 0.95), rgba(7, 7, 7, 0.98))' : '#3d2b1f',
        inactive: isObsidian ? '#9b7e3e' : '#a89080',
        active: isObsidian ? '#E6C97A' : '#ffff00', // Bright Yellow for standard, Premium Gold for Obsidian
    };

    // Hide on desktop
    const isMobileView = 'md:hidden';

    return (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-fit ${isMobileView}`}>
            <nav
                className="relative flex items-center justify-center gap-1 px-5 py-1.5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-md"
                style={{
                    background: COLORS.bg,
                    border: isObsidian ? '1.5px solid rgba(230, 201, 122, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: isObsidian 
                      ? '0 20px 50px rgba(0,0,0,0.5), 0 0 15px rgba(230, 201, 122, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.05)'
                      : '0 20px 50px rgba(0,0,0,0.3)'
                }}
            >
                {navItems.map((item, index) => {
                    const isActive = location.pathname === item.path;

                    return (
                        <React.Fragment key={item.path}>
                            <NavLink
                                to={item.path}
                                className="relative flex flex-col items-center justify-center w-12 h-12 transition-all duration-300"
                            >
                                {/* Spotlight bg behind active item (Obsidian specific) */}
                                {isActive && isObsidian && (
                                    <motion.div
                                        layoutId="activeSpotlightMobile"
                                        className="absolute w-10 h-10 rounded-full pointer-events-none"
                                        style={{ 
                                            background: 'radial-gradient(circle, rgba(230, 201, 122, 0.2) 0%, rgba(230, 201, 122, 0) 70%)',
                                            border: '1px solid rgba(230, 201, 122, 0.12)'
                                        }}
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    />
                                )}

                                <motion.div
                                    animate={{
                                        color: isActive ? COLORS.active : COLORS.inactive,
                                        scale: isActive ? 1.12 : 1,
                                        filter: isActive && isObsidian ? 'drop-shadow(0 0 6px rgba(230, 201, 122, 0.6))' : 'none'
                                    }}
                                    className="z-10 flex items-center justify-center"
                                >
                                    {item.icon}
                                </motion.div>

                                {isActive && !isObsidian && (
                                    <motion.div
                                        layoutId="activeTabMobile"
                                        className="absolute -bottom-1 w-6 h-1 rounded-full"
                                        style={{ backgroundColor: COLORS.active }}
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </NavLink>

                            {/* Separator line for Obsidian (between tabs) */}
                            {isObsidian && index < navItems.length - 1 && (
                                <div 
                                    className="w-px h-6 opacity-30 mx-0.5" 
                                    style={{ 
                                        backgroundColor: 'rgba(230, 201, 122, 0.4)',
                                    }} 
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </nav>
        </div>
    );
};

export default MobileBottomNavbar;
