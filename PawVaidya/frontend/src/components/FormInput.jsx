import React from 'react'

const FormInput = ({ type, name, placeholder, value, onChange, icon, ...props }) => {
  return (
    <div className="relative group/input transition-all duration-300">
      {/* Icon with interactive scaling and color shift */}
      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover/input:text-[#489065] group-focus-within/input:text-[#489065] group-focus-within/input:scale-110 transition-all duration-300 z-10">
        {icon}
      </span>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...props}
        className="w-full p-4 pl-12 rounded-xl bg-white/45 border border-white/60 
                 backdrop-blur-sm text-gray-800 placeholder-gray-400/80
                 focus:bg-white/90 focus:border-[#489065] focus:ring-4 focus:ring-[#489065]/15 
                 transition-all duration-300 outline-none shadow-sm hover:shadow-md hover:scale-[1.005] focus:scale-[1.01]
                 hover:border-[#489065]/40 hover:bg-white/60"
      />
      {/* Glowing backdrop layer on focus */}
      <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-[#489065]/10 to-[#2e5b40]/10 opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300 blur-sm" />
    </div>
  )
}

export default FormInput