import React, { useContext } from 'react'
import Header from '../components/Header'
import SpecialityMenu from '../components/SpecialityMenu'
import TopDoctors from '../components/TopDoctors'
import Banner from '../components/Banner'
import PawBackground from '../components/PawBackground'
import PollCard from '../components/PollCard'
import WeatherCareAlerts from '../components/WeatherCareAlerts'
import SubscriptionBanner from '../components/SubscriptionBanner'
import { AppContext } from '../context/AppContext'

export const Home = () => {
  const { userdata } = useContext(AppContext);
  const isObsidian = userdata?.subscription?.plan === 'Obsidian' && userdata?.subscription?.status === 'Active';

  return (
    <div className={`relative min-h-screen pb-12 transition-colors duration-500 ${isObsidian ? 'bg-[#050505] text-[#F5F2EA]' : ''}`} style={isObsidian ? {} : { background: '#f2e4c7' }}>
      <PawBackground density="normal" />

      {isObsidian ? (
        <div className="relative px-3 sm:px-4 z-30 max-w-7xl mx-auto mb-10">
          {/* Top Weather & Alerts Grid */}
          <WeatherCareAlerts />

          {/* Main Hero Card Container */}
          <div
            className="relative overflow-hidden rounded-[2.5rem] mt-4 border"
            style={{
              background: 'radial-gradient(ellipse at 65% 40%, rgba(26,19,13,0.99) 0%, rgba(10,10,10,1) 45%, rgba(5,5,5,1) 100%)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.95), inset 0 1px 0 rgba(212,175,55,0.2)',
              borderColor: 'rgba(230,201,122,0.25)'
            }}
          >
            {/* Texture 2: Top-right golden radial spotlight */}
            <div
              className="absolute -top-24 right-0 w-[480px] h-[480px] rounded-full pointer-events-none z-0"
              style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.3) 0%, rgba(212,175,55,0.08) 45%, transparent 70%)' }}
            />

            {/* Texture 3: Bottom left warm glow */}
            <div
              className="absolute bottom-0 -left-10 w-72 h-72 rounded-full pointer-events-none z-0"
              style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.18) 0%, transparent 70%)' }}
            />

            {/* Texture 4: Scattered micro-stars SVG */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-25" xmlns="http://www.w3.org/2000/svg">
              {[
                [7, 10], [20, 35], [38, 7], [62, 52], [78, 18], [91, 68], [13, 80], [48, 88], [28, 58], [70, 33],
                [86, 48], [4, 42], [53, 16], [43, 76], [66, 86], [24, 22], [58, 43], [33, 4], [76, 60], [9, 65],
                [50, 30], [15, 55], [85, 25], [40, 95], [72, 10], [30, 80], [95, 40], [20, 72], [60, 20], [85, 75]
              ].map(([cx, cy], i) => (
                <circle
                  key={i}
                  cx={`${cx}%`} cy={`${cy}%`}
                  r={i % 5 === 0 ? '1.5' : i % 3 === 0 ? '1.2' : '0.8'}
                  fill="#D4AF37"
                  opacity={i % 4 === 0 ? '0.9' : '0.5'}
                />
              ))}
            </svg>

            {/* Content */}
            <div className="relative z-10">
              <Header />
            </div>
          </div>
        </div>
      ) : (
        /* Legacy (Standard) layout */
        <div className="relative px-3 sm:px-4 z-30 drop-shadow-2xl mb-10 max-w-7xl mx-auto">
          <div
            className="relative overflow-hidden rounded-[2.5rem] transition-all duration-500 border border-transparent"
            style={{
              background: 'radial-gradient(ellipse at 65% 40%, rgba(105,60,22,0.98) 0%, rgba(58,33,14,1) 45%, rgba(28,14,5,1) 100%)',
              boxShadow: '0 20px 40px -8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)'
            }}
          >
            <div
              className="absolute -top-24 right-0 w-[480px] h-[480px] rounded-full pointer-events-none z-0"
              style={{ background: 'radial-gradient(circle, rgba(210,140,10,0.22) 0%, rgba(200,120,10,0.07) 45%, transparent 70%)' }}
            />
            <div
              className="absolute bottom-0 -left-10 w-72 h-72 rounded-full pointer-events-none z-0"
              style={{ background: 'radial-gradient(circle, rgba(160,80,20,0.15) 0%, transparent 70%)' }}
            />
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-25" xmlns="http://www.w3.org/2000/svg">
              {[
                [7, 10], [20, 35], [38, 7], [62, 52], [78, 18], [91, 68], [13, 80], [48, 88], [28, 58], [70, 33],
                [86, 48], [4, 42], [53, 16], [43, 76], [66, 86], [24, 22], [58, 43], [33, 4], [76, 60], [9, 65],
                [50, 30], [15, 55], [85, 25], [40, 95], [72, 10], [30, 80], [95, 40], [20, 72], [60, 20], [85, 75]
              ].map(([cx, cy], i) => (
                <circle
                  key={i}
                  cx={`${cx}%`} cy={`${cy}%`}
                  r={i % 5 === 0 ? '1.5' : i % 3 === 0 ? '1.2' : '0.8'}
                  fill={i % 4 === 0 ? '#f9d371' : i % 3 === 0 ? '#ffe8a0' : '#ffffff'}
                  opacity={i % 4 === 0 ? '0.9' : '0.5'}
                />
              ))}
            </svg>

            <div className="relative z-10">
              <WeatherCareAlerts />
              <div className="w-[88%] mx-auto h-[1px] bg-gradient-to-r from-transparent via-amber-500/25 to-transparent" />
              <Header />
            </div>
          </div>
        </div>
      )}

      <div className="-mt-4 relative z-20 max-w-7xl mx-auto px-4">
        <SpecialityMenu />
        <TopDoctors />
        <SubscriptionBanner />
        <PollCard />
        <Banner />
      </div>
    </div>
  )
}

export default Home