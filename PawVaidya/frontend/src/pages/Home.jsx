import React from 'react'
import Header from '../components/Header'
import SpecialityMenu from '../components/SpecialityMenu'
import TopDoctors from '../components/TopDoctors'
import Banner from '../components/Banner'
import PawBackground from '../components/PawBackground'

export const Home = () => {
  return (
    <div className="relative" style={{ background: '#f2e4c7' }}>
      <PawBackground density="normal" />
      <Header />
      <SpecialityMenu />
      <TopDoctors />
      <Banner />
    </div>
  )
}

export default Home