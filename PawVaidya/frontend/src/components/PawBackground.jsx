import React from 'react';
import { motion } from 'framer-motion';

const PawBackground = ({ density = 'normal' }) => {
    // Density options: 'light', 'normal', 'dense'
    const pawCounts = {
        light: 3,
        normal: 5,
        dense: 8
    };

    const pawCount = pawCounts[density] || pawCounts.normal;

    // Generate random positions for paws
    const generatePawPositions = () => {
        const positions = [];
        for (let i = 0; i < pawCount; i++) {
            positions.push({
                top: `${Math.random() * 80 + 10}%`,
                left: `${Math.random() * 80 + 10}%`,
                size: Math.random() * 40 + 40, // 40-80px
                rotation: Math.random() * 360,
                duration: Math.random() * 15 + 15, // 15-30s
                delay: Math.random() * 5
            });
        }
        return positions;
    };

    const pawPositions = React.useMemo(() => generatePawPositions(), [pawCount]);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Animated gradient orbs */}
            <motion.div
                className="absolute top-10 right-20 w-32 h-32 bg-green-200/20 rounded-full blur-3xl"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div
                className="absolute bottom-20 left-10 w-40 h-40 bg-blue-200/20 rounded-full blur-3xl"
                animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ duration: 5, repeat: Infinity }}
            />

            {/* Floating paw prints */}
            {pawPositions.map((paw, index) => (
                <motion.div
                    key={index}
                    className="absolute"
                    style={{
                        top: paw.top,
                        left: paw.left,
                        fontSize: `${paw.size}px`,
                        opacity: 0.08
                    }}
                    animate={{
                        y: [0, -20, 0],
                        rotate: [paw.rotation, paw.rotation + 10, paw.rotation],
                    }}
                    transition={{
                        duration: paw.duration,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: paw.delay
                    }}
                >
                    🐾
                </motion.div>
            ))}
        </div>
    );
};

export default PawBackground;
