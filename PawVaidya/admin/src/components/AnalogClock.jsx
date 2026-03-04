import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const AnalogClock = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const seconds = time.getSeconds();
    const minutes = time.getMinutes();
    const hours = time.getHours();

    // Calculate rotation degrees
    const secondDegrees = (seconds / 60) * 360;
    const minuteDegrees = (minutes / 60) * 360 + (seconds / 60) * 6;
    const hourDegrees = (hours % 12 / 12) * 360 + (minutes / 60) * 30;

    return (
        <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full border-2 border-amber-100 bg-white shadow-inner flex items-center justify-center p-1">
                {/* Center dot */}
                <div className="absolute w-1.5 h-1.5 bg-amber-600 rounded-full z-10 shadow-sm border border-white"></div>

                {/* Hour hand */}
                <motion.div
                    className="absolute w-1 h-5 bg-[#5A4035] rounded-full origin-bottom"
                    style={{ bottom: '50%', rotate: hourDegrees }}
                    animate={{ rotate: hourDegrees }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                ></motion.div>

                {/* Minute hand */}
                <motion.div
                    className="absolute w-0.5 h-7 bg-gray-600 rounded-full origin-bottom"
                    style={{ bottom: '50%', rotate: minuteDegrees }}
                    animate={{ rotate: minuteDegrees }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                ></motion.div>

                {/* Second hand */}
                <motion.div
                    className="absolute w-[1px] h-7 bg-[#c8860a] rounded-full origin-bottom"
                    style={{ bottom: '50%', rotate: secondDegrees }}
                    animate={{ rotate: secondDegrees }}
                    transition={{ type: "linear", duration: 0.1 }}
                ></motion.div>

                {/* Hour Markers */}
                {[...Array(12)].map((_, i) => (
                    <div
                        key={i}
                        className={`absolute w-[1px] ${i % 3 === 0 ? 'h-1.5 bg-amber-400' : 'h-1 bg-amber-100'}`}
                        style={{
                            top: '2px',
                            transformOrigin: '50% 30px',
                            rotate: `${i * 30}deg`
                        }}
                    ></div>
                ))}
            </div>
            <div className="flex flex-col">
                <p className="text-xl font-black text-[#5A4035] leading-none">
                    {time.toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1">
                    Current Time
                </p>
            </div>
        </div>
    );
};

export default AnalogClock;
