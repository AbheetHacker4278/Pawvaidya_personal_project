import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, CloudRain, Snowflake, ThermometerSun, Wind, MapPin, Droplets, CloudLightning, Cloud, Sparkles, Moon, PawPrint, ChevronRight } from 'lucide-react';
import { AppContext } from '../context/AppContext';

const weatherTheme = (temp, code) => {
    if (code === 0 || code === 1) {
        return {
            condition: "Mostly Clear",
            icon: <Sun className="w-12 h-12 text-amber-400" strokeWidth={1.5} />,
            iconGlow: "drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]",
            badge: "☀️",
            accent: "#E6C97A",
            accentBg: "rgba(230,201,122,0.15)",
            accentBorder: "rgba(230,201,122,0.25)",
            gradient: "from-amber-500/20 to-orange-600/10",
            advice: temp > 28 ? "Warm day! Walk early morning or late evening to protect paws." : "Perfect weather! Great time for a sunny walk.",
            alertIcon: "🐾"
        };
    } else if (code === 2 || code === 3) {
        return {
            condition: "Partly Cloudy",
            icon: <Cloud className="w-12 h-12 text-amber-200" strokeWidth={1.5} />,
            iconGlow: "drop-shadow-[0_0_12px_rgba(254,236,139,0.6)]",
            badge: "⛅",
            accent: "#fce4a0",
            accentBg: "rgba(252,228,160,0.12)",
            accentBorder: "rgba(252,228,160,0.25)",
            gradient: "from-yellow-400/15 to-amber-500/5",
            advice: temp < 10 ? "A bit chilly! Consider a light sweater." : "Mild and cloudy. Perfect for outdoor playtime!",
            alertIcon: "🌤️"
        };
    } else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
        return {
            condition: "Rainy",
            icon: <CloudRain className="w-12 h-12 text-blue-300" strokeWidth={1.5} />,
            iconGlow: "drop-shadow-[0_0_12px_rgba(147,197,253,0.7)]",
            badge: "🌧️",
            accent: "#7ec8e3",
            accentBg: "rgba(126,200,227,0.12)",
            accentBorder: "rgba(126,200,227,0.25)",
            gradient: "from-blue-400/20 to-cyan-500/10",
            advice: "Rainy outside! Grab a raincoat and keep paws dry.",
            alertIcon: "☔"
        };
    } else if ([95, 96, 99].includes(code)) {
        return {
            condition: "Thunderstorm",
            icon: <CloudLightning className="w-12 h-12 text-purple-300" strokeWidth={1.5} />,
            iconGlow: "drop-shadow-[0_0_12px_rgba(216,180,254,0.8)]",
            badge: "⛈️",
            accent: "#c084fc",
            accentBg: "rgba(192,132,252,0.12)",
            accentBorder: "rgba(192,132,252,0.25)",
            gradient: "from-purple-500/20 to-pink-600/10",
            advice: "Stormy! Keep pets indoors and comfortable.",
            alertIcon: "⚡"
        };
    } else if ([71, 73, 75, 77, 85, 86].includes(code)) {
        return {
            condition: "Snowing",
            icon: <Snowflake className="w-12 h-12 text-white" strokeWidth={1.5} />,
            iconGlow: "drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]",
            badge: "❄️",
            accent: "#e0f2fe",
            accentBg: "rgba(224,242,254,0.12)",
            accentBorder: "rgba(224,242,254,0.25)",
            gradient: "from-sky-300/20 to-blue-400/10",
            advice: "Snowy! Protect paws from ice and salt.",
            alertIcon: "🌨️"
        };
    } else {
        if (temp > 32) return {
            condition: "Excessive Heat",
            icon: <ThermometerSun className="w-12 h-12 text-orange-500" strokeWidth={1.5} />,
            iconGlow: "drop-shadow-[0_0_12px_rgba(249,115,22,0.7)]",
            badge: "🌡️",
            accent: "#fb923c",
            accentBg: "rgba(251,146,60,0.12)",
            accentBorder: "rgba(251,146,60,0.3)",
            gradient: "from-red-500/20 to-orange-600/10",
            advice: "Dangerously hot! Stay indoors, ensure hydration.",
            alertIcon: "🔥"
        };
        return {
            condition: "Clear",
            icon: <Sun className="w-12 h-12 text-amber-400" strokeWidth={1.5} />,
            iconGlow: "drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]",
            badge: "☀️",
            accent: "#E6C97A",
            accentBg: "rgba(230,201,122,0.15)",
            accentBorder: "rgba(230,201,122,0.25)",
            gradient: "from-amber-500/20 to-orange-600/10",
            advice: "Great weather for a walk!",
            alertIcon: "🐾"
        };
    }
};

const WeatherCareAlerts = () => {
    const { userdata } = useContext(AppContext);
    const isObsidian = userdata?.subscription?.plan === 'Obsidian' && userdata?.subscription?.status === 'Active';
    const [weatherData, setWeatherData] = useState(null);
    const [humidity, setHumidity] = useState(null);
    const [locationName, setLocationName] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWeather = async (lat, lon) => {
            try {
                const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`);
                if (!response.ok) throw new Error("Weather request failed");
                const wData = await response.json();
                setWeatherData({
                    temperature: wData.current.temperature_2m,
                    windspeed: wData.current.wind_speed_10m,
                    weathercode: wData.current.weather_code
                });
                setHumidity(wData.current.relative_humidity_2m);
                try {
                    const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                    const geoData = await geoRes.json();
                    const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.county || "Local Area";
                    setLocationName(city);
                } catch { setLocationName("Local Area"); }
            } catch (err) {
                console.error("Unable to fetch weather:", err);
            } finally {
                setLoading(false);
            }
        };
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
                () => { fetchWeather(28.6139, 77.2090); setLocationName("New Delhi"); }
            );
        } else {
            fetchWeather(28.6139, 77.2090);
            setLocationName("New Delhi");
        }
    }, []);

    if (loading) {
        return (
            <div className="w-full px-4 pt-5 pb-3">
                <div className="h-24 w-full rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
            </div>
        );
    }

    if (!weatherData) return null;

    const { temperature, windspeed, weathercode } = weatherData;
    const theme = weatherTheme(temperature, weathercode);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="w-full px-4 pt-5 pb-4"
            >
                <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* ── Card 1: Temperature & Location ── */}
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        className={`relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between min-h-[140px] ${
                            isObsidian
                                ? 'bg-[#0E0E0E]/80 border border-[#E6C97A]/15 shadow-[0_0_15px_rgba(0,0,0,0.5)]'
                                : 'bg-white/40 border border-white/20'
                        }`}
                        style={{ backdropFilter: 'blur(12px)' }}
                    >
                        {/* Glow accent */}
                        <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: isObsidian ? 'rgba(230,201,122,0.15)' : theme.accentBg }} />

                        <div className="flex items-center justify-between mb-3 z-10">
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${isObsidian ? 'bg-black/40 border border-zinc-800' : 'bg-white/10 border border-white/10'}`}>
                                <MapPin className="w-3.5 h-3.5 text-[#E6C97A]" />
                                <span className="text-[11px] font-bold text-white/90 tracking-wide">{locationName}</span>
                            </div>
                            <span className="text-[11px] font-bold uppercase tracking-widest text-[#E6C97A] flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#E6C97A] animate-ping" />
                                Live
                            </span>
                        </div>

                        <div className="flex items-end justify-between z-10 mt-auto">
                            <div className="flex items-end gap-3">
                                <span className="text-[56px] sm:text-[64px] font-black text-white leading-none tracking-tighter" style={{ fontFamily: 'Inter, sans-serif' }}>
                                    {Math.round(temperature)}°
                                </span>
                                <div className="pb-1.5 flex flex-col">
                                    <span className="text-base font-bold leading-tight text-[#E6C97A]">{theme.condition}</span>
                                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30 mt-0.5">Real-time update</span>
                                </div>
                            </div>

                            {isObsidian && (
                                <div className="relative w-24 h-24 pointer-events-none z-0 flex items-center justify-center -mb-4 -mr-4">
                                    <Moon className="w-14 h-14 text-[#E6C97A] fill-[#E6C97A] drop-shadow-[0_0_15px_rgba(230,201,122,0.5)] absolute top-0 right-4 rotate-12" />
                                    <Cloud className="w-14 h-14 text-zinc-700 fill-zinc-800 absolute bottom-4 right-0 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]" strokeWidth={1} />
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* ── Card 2: Humidity & Wind ── */}
                    {isObsidian ? (
                        <motion.div
                            whileHover={{ scale: 1.01 }}
                            className="relative overflow-hidden rounded-2xl p-5 flex flex-col justify-end min-h-[140px] bg-[#0E0E0E]/80 border border-[#E6C97A]/15 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                        >
                            {/* Sun graphic at top center */}
                            <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-36 h-36 rounded-full flex items-center justify-center opacity-70">
                                <div className="absolute inset-0 bg-gradient-to-b from-[#E6C97A]/25 to-transparent blur-xl rounded-full" />
                                <Sun className="w-10 h-10 text-[#E6C97A]/30 animate-[spin_60s_linear_infinite]" strokeWidth={1.5} />
                            </div>

                            {/* Metrics Row */}
                            <div className="flex items-center w-full justify-between px-2 z-10 mt-auto">
                                <div className="flex flex-col items-center flex-1 justify-center">
                                    <div className="flex items-center gap-2">
                                        <Droplets className="w-5 h-5 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                                        <span className="text-white font-black text-lg">{humidity ?? '--'}%</span>
                                    </div>
                                    <span className="text-neutral-500 font-bold text-[10px] uppercase tracking-wider mt-1">Humidity</span>
                                </div>

                                <div className="w-[1px] h-10 bg-zinc-800 mx-2" />

                                <div className="flex flex-col items-center flex-1 justify-center">
                                    <div className="flex items-center gap-2">
                                        <Wind className="w-5 h-5 text-[#E6C97A] drop-shadow-[0_0_8px_rgba(230,201,122,0.4)]" />
                                        <span className="text-white font-black text-lg">{windspeed} km/h</span>
                                    </div>
                                    <span className="text-neutral-500 font-bold text-[10px] uppercase tracking-wider mt-1">Wind Speed</span>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            whileHover={{ scale: 1.01 }}
                            className="relative overflow-hidden rounded-2xl p-4 flex flex-col items-center justify-center gap-3 bg-white/40 border border-white/20"
                            style={{ backdropFilter: 'blur(12px)' }}
                        >
                            {/* Animated icon */}
                            <motion.div
                                animate={{ y: [0, -6, 0], rotate: [0, 5, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                                className={theme.iconGlow}
                            >
                                {theme.icon}
                            </motion.div>

                            {/* Metrics Row */}
                            <div className="flex items-center gap-4 w-full justify-center px-2">
                                <div className="flex items-center gap-2 flex-1 justify-center px-3 py-2 rounded-xl bg-white/10">
                                    <Droplets className="w-3.5 h-3.5 text-sky-300 flex-shrink-0" />
                                    <span className="text-white font-semibold text-sm">{humidity ?? '--'}%</span>
                                </div>
                                <div className="flex items-center gap-2 flex-1 justify-center px-3 py-2 rounded-xl bg-white/10">
                                    <Wind className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                                    <span className="text-white font-semibold text-sm">{windspeed} km/h</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Card 3: Paw Care Alert ── */}
                    {isObsidian ? (
                        <motion.div
                            whileHover={{ scale: 1.01 }}
                            className="relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between min-h-[140px] bg-[#0E0E0E]/80 border border-[#E6C97A]/15 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                        >
                            {/* Faint Paw watermark in top right */}
                            <div className="absolute top-4 right-4 opacity-[0.03] text-[#E6C97A] pointer-events-none">
                                <svg viewBox="0 0 24 24" className="w-16 h-16" fill="currentColor">
                                    <path d="M12 14c-1.66 0-3 1.34-3 3 0 2 2 3.5 3 3.5s3-1.5 3-3.5c0-1.66-1.34-3-3-3zm-4.5-2.5c-.83 0-1.5-.67-1.5-1.5S6.67 8.5 7.5 8.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-6.2-3c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3.4 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                                </svg>
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-[#E6C97A]" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-white">Paw Care Alert</span>
                            </div>

                            <p className="text-white/80 text-[13px] leading-relaxed font-medium flex-1">
                                {theme.advice}
                            </p>

                            <div className="mt-2 flex items-center justify-between z-10">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs">⚡</span>
                                    <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">PawVaidya Weather</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-[#E6C97A] cursor-pointer" />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            whileHover={{ scale: 1.01 }}
                            className="relative overflow-hidden rounded-2xl p-4 flex flex-col justify-between bg-white/40 border border-white/20"
                            style={{ backdropFilter: 'blur(12px)' }}
                        >
                            {/* Left accent line */}
                            <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full bg-amber-500" />

                            <div className="flex items-center gap-2 mb-2 pl-3">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-white">Paw Care Alert</span>
                            </div>

                            <p className="text-white/80 text-[13px] leading-relaxed font-medium pl-3 flex-1">
                                {theme.advice}
                            </p>

                            <div className="mt-2 pl-3 flex items-center gap-1.5">
                                <span className="text-xs">{theme.alertIcon}</span>
                                <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">PawVaidya Weather</span>
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default WeatherCareAlerts;
