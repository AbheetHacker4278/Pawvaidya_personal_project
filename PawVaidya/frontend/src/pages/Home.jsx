import React from 'react'
import Header from '../components/Header'
import SpecialityMenu from '../components/SpecialityMenu'
import TopDoctors from '../components/TopDoctors'
import Banner from '../components/Banner'
import PawBackground from '../components/PawBackground'
import PollCard from '../components/PollCard'
import WeatherCareAlerts from '../components/WeatherCareAlerts'
import SubscriptionBanner from '../components/SubscriptionBanner'

export const Home = () => {
  return (
    <div className="relative" style={{ background: '#f2e4c7' }}>
      <PawBackground density="normal" />

      {/* Unified Hero Wrapper for Weather + Header */}
      <div className="relative px-3 sm:px-4 z-30 drop-shadow-2xl mb-10">
        <div
          className="relative overflow-hidden rounded-[2rem]"
          style={{
            background: 'radial-gradient(ellipse at 65% 40%, rgba(105,60,22,0.98) 0%, rgba(58,33,14,1) 45%, rgba(28,14,5,1) 100%)',
            boxShadow: '0 20px 40px -8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)'
          }}
        >
          {/* Texture 1: Fine grain noise */}
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 512 512\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
              opacity: 0.08
            }}
          />

          {/* Texture 2: Top-right golden radial spotlight */}
          <div
            className="absolute -top-24 right-0 w-[480px] h-[480px] rounded-full pointer-events-none z-0"
            style={{ background: 'radial-gradient(circle, rgba(210,140,10,0.22) 0%, rgba(200,120,10,0.07) 45%, transparent 70%)' }}
          />

          {/* Texture 3: Bottom left warm glow */}
          <div
            className="absolute bottom-0 -left-10 w-72 h-72 rounded-full pointer-events-none z-0"
            style={{ background: 'radial-gradient(circle, rgba(160,80,20,0.15) 0%, transparent 70%)' }}
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
                fill={i % 4 === 0 ? '#f9d371' : i % 3 === 0 ? '#ffe8a0' : '#ffffff'}
                opacity={i % 4 === 0 ? '0.9' : '0.5'}
              />
            ))}
          </svg>

          {/* Content */}
          <div className="relative z-10">
            <WeatherCareAlerts />
            {/* Subtle divider */}
            <div className="w-[88%] mx-auto h-[1px] bg-gradient-to-r from-transparent via-amber-500/25 to-transparent" />
            <Header />
          </div>
        </div>
      </div>

      <div className="-mt-4 relative z-20">
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