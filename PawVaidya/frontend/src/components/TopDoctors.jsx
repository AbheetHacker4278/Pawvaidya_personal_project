import { useContext, useState } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { translateSpeciality } from '../utils/translateSpeciality';

const TopDoctors = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { doctors } = useContext(AppContext);
  const [hoveredCard, setHoveredCard] = useState(null);

  // Animation variants for staggered children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 100
      }
    }
  };

  return (
    <div className='flex flex-col gap-8 my-20 text-gray-900 md:mx-10 px-4 overflow-hidden'>
      {/* Enhanced Title with gradient */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className='text-center'
      >
        <motion.h1
          className='text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#5A4035] via-[#7a5a48] to-[#5A4035] bg-clip-text text-transparent mb-3'
          animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        >
          {t('home.topDoctors')}
        </motion.h1>
        <motion.div
          className='w-24 h-1 mx-auto rounded-full'
          style={{ background: 'linear-gradient(to right, #5A4035, #c8860a)' }}
          initial={{ width: 0 }}
          animate={{ width: 96 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />
      </motion.div>

      {/* Doctor Cards Grid */}
      <div className='w-full flex justify-center'>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 pt-8 px-3 sm:px-0 max-w-[1600px]'
        >
          <AnimatePresence>
            {doctors.slice(0, 10).map((item, index) => (
              <motion.div
                key={index}
                variants={cardVariants}
                whileHover={{
                  y: -12,
                  rotateY: 5,
                  transition: { duration: 0.3 }
                }}
                whileTap={{ scale: 0.97 }}
                onHoverStart={() => setHoveredCard(index)}
                onHoverEnd={() => setHoveredCard(null)}
                onClick={() => { navigate(`/appointment/${item._id}`); scrollTo(0, 0); }}
                className='group relative bg-white shadow-xl rounded-3xl overflow-hidden cursor-pointer w-full max-w-[280px] mx-auto transform perspective-1000'
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Gradient overlay on hover */}
                <motion.div
                  className='absolute inset-0 z-10 transition-opacity duration-500'
                  style={{ background: 'linear-gradient(135deg, rgba(90,64,53,0.15), transparent, rgba(200,134,10,0.10))' }}
                  initial={false}
                  animate={{ opacity: hoveredCard === index ? 1 : 0 }}
                />

                {/* Shimmer effect */}
                <div className='absolute inset-0 z-20 pointer-events-none overflow-hidden'>
                  <motion.div
                    className='absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12'
                    animate={hoveredCard === index ? { left: '200%' } : { left: '-100%' }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  />
                </div>

                {/* Image Container with enhanced effects */}
                <div className='relative h-[220px] overflow-hidden' style={{ background: 'linear-gradient(135deg, #f5ede8, #fdf8f0)' }}>
                  <motion.img
                    className='w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700'
                    src={item.image}
                    alt={item.name}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: hoveredCard === index ? 1.15 : 1 }}
                    transition={{ duration: 0.5 }}
                  />

                  {/* Availability badge with glow */}
                  <motion.div
                    className={`absolute top-4 right-4 px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-2 shadow-lg ${item.available
                        ? 'bg-green-500/90 text-white'
                        : 'bg-gray-500/90 text-white'
                      }`}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                    whileHover={{ scale: 1.1 }}
                  >
                    <motion.div
                      className={`w-2.5 h-2.5 rounded-full ${item.available ? 'bg-white' : 'bg-gray-300'
                        }`}
                      animate={item.available ? {
                        scale: [1, 1.3, 1],
                        boxShadow: [
                          '0 0 0 0 rgba(255,255,255,0.7)',
                          '0 0 0 6px rgba(255,255,255,0)',
                          '0 0 0 0 rgba(255,255,255,0)'
                        ]
                      } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className='text-xs font-semibold'>
                      {item.available ? t('common.available') : t('common.notAvailable')}
                    </span>
                  </motion.div>

                  {/* Decorative corner accent */}
                  <div className='absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-white/30 to-transparent rounded-tl-full' />
                </div>

                {/* Content Section */}
                <div className='p-6 flex flex-col gap-3 bg-gradient-to-b from-white to-gray-50/50'>
                  {/* Doctor Name */}
                  <motion.h3
                    className='text-xl font-bold text-gray-900 group-hover:text-[#5A4035] transition-colors duration-300 line-clamp-1'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.4 }}
                  >
                    {item.name}
                  </motion.h3>

                  {/* Speciality with icon */}
                  <motion.div
                    className='flex items-center gap-2 text-sm text-gray-600'
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.5 }}
                  >
                    <svg className='w-4 h-4' style={{ color: '#c8860a' }} fill='currentColor' viewBox='0 0 20 20'>
                      <path d='M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z' />
                    </svg>
                    <span className='font-medium'>{translateSpeciality(item.speciality, t)}</span>
                  </motion.div>

                  {/* Location badges */}
                  <motion.div
                    className='flex flex-wrap gap-2'
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.6 }}
                  >
                    <span className='inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm' style={{ background: '#f5ede8', color: '#5A4035', border: '1px solid #e8d5b0' }}>
                      <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                        <path fillRule='evenodd' d='M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z' clipRule='evenodd' />
                      </svg>
                      {item.address.Location}
                    </span>
                    <span className='inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm' style={{ background: '#fff8e6', color: '#c8860a', border: '1px solid #f0d080' }}>
                      {item.address.line}
                    </span>
                  </motion.div>

                  {/* View Details Button - appears on hover */}
                  <motion.div
                    className='mt-2 pt-3 border-t border-gray-200'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hoveredCard === index ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className='flex items-center justify-center gap-2 text-[#5A4035] font-semibold text-sm'>
                      <span>View Profile</span>
                      <motion.svg
                        className='w-4 h-4'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                        animate={{ x: hoveredCard === index ? 5 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                      </motion.svg>
                    </div>
                  </motion.div>
                </div>

                {/* Bottom glow effect */}
                <motion.div
                  className='absolute bottom-0 left-0 right-0 h-1'
                  style={{ background: 'linear-gradient(to right, #5A4035, #c8860a, #5A4035)' }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: hoveredCard === index ? 1 : 0 }}
                  transition={{ duration: 0.4 }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Enhanced Explore Button */}
      <motion.div
        className='flex justify-center w-full mt-12'
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <motion.button
          whileHover={{
            scale: 1.05,
            boxShadow: "0 20px 40px rgba(90, 64, 53, 0.3)"
          }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { navigate('/doctors'); scrollTo(0, 0); }}
          className='group relative px-12 py-4 bg-gradient-to-r from-[#5A4035] to-[#7a5a48] text-white rounded-full text-lg font-bold shadow-xl overflow-hidden'
        >
          {/* Animated background */}
          <motion.div
            className='absolute inset-0 bg-gradient-to-r from-[#7a5a48] to-[#5A4035]'
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.6 }}
          />

          <span className='relative z-10 flex items-center gap-3'>
            {t('home.exploreBtn')}
            <motion.svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 7l5 5m0 0l-5 5m5-5H6' />
            </motion.svg>
          </span>

          {/* Glow effect */}
          <div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500'>
            <div className='absolute inset-0 bg-white/20 blur-xl' />
          </div>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default TopDoctors;
