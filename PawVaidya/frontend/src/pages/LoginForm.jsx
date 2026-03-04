import React, { useContext, useState, useEffect } from 'react'
import FormInput from '../components/FormInput'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { toast } from "react-toastify"
import axios from "axios"
import image from '../assets/New/image.png'
import { Mail, Lock } from 'lucide-react';

const LoginForm = () => {
  const { backendurl, token, settoken, setisLoggedin } = useContext(AppContext)
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  })
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    setIsLoading(true);
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(`${backendurl}/api/user/login`, { email, password });
      if (data.success) {
        localStorage.setItem('token', data.token);
        settoken(data.token);
        setisLoggedin(true);
        toast.success("Login successful!");
        navigate('/');
      } else {
        toast.error(data.message || "Login failed. Please check your credentials.");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "An error occurred during login.";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F2E4C6] overflow-hidden relative">
      {/* Logo - Fade in from top */}
      <div className={`absolute top-4 left-4 w-24 sm:w-32 z-50 transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'
        }`}>
        <img
          src={image}
          alt="Logo"
          className="w-full h-auto rounded-2xl shadow-lg hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Left side - Image with slide-in animation  */}
      <div className={`hidden lg:flex lg:w-1/2 items-center justify-center p-12 bg-gradient-to-br from-[#A8D5BA] to-[#8FC1A3] transform transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
        }`}>
        <div className="relative w-full max-w-xl">
          {/* Animated background circles */}
          <div className="absolute -top-10 -left-10 w-24 h-24 bg-white/20 rounded-full animate-pulse"></div>
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: '700ms' }}></div>
          <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-white/10 rounded-full animate-pulse" style={{ animationDelay: '500ms' }}></div>

          <img
            src="https://i.ibb.co/N2dwZpC/1fc8fd8a-8ea8-4383-9bb0-3cf75b23cdc4-removebg-preview-1.png"
            alt="Veterinary Care"
            className="relative z-10 w-full h-auto rounded-3xl transform hover:scale-105 transition-transform duration-500 drop-shadow-2xl"
          />
        </div>
      </div>

      {/* Right side - Form with slide-in animation  */}
      <div className={`w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 bg-[#F2E4C6] transform transition-all duration-1000 delay-200 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}>
        <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/50">
          {/* Header with fade-in */}
          <div className={`space-y-2 mb-8 bg-transparent transform transition-all duration-700 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#489065] to-[#2e5b40] bg-clip-text text-transparent animate-gradient">
              Welcome Back!
            </h1>
            <p className="text-gray-600 bg-transparent">Access expert advice for your furry friends</p>
          </div>

          {/* Form with staggered animations */}
          <form onSubmit={onSubmitHandler} className="space-y-5 bg-transparent">
            <div className={`transform transition-all duration-500 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}>
              <FormInput
                type="email"
                name="email"
                placeholder="Your email"
                value={formData.email}
                onChange={handleInputChange}
                icon={<Mail size={20} />}
              />
            </div>

            <div className={`transform transition-all duration-500 delay-600 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}>
              <FormInput
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                icon={<Lock size={20} />}
              />
            </div>

            <div className={`flex items-center justify-between bg-transparent transform transition-all duration-500 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}>
              <div className="flex items-center gap-2 bg-transparent group">
                <input
                  type="checkbox"
                  name="remember"
                  id="remember"
                  checked={formData.remember}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded border-gray-300 text-[#2A9D8F] focus:ring-[#2A9D8F] cursor-pointer transition-transform duration-200 hover:scale-110"
                />
                <label htmlFor="remember" className="text-sm text-gray-600 bg-transparent cursor-pointer group-hover:text-gray-800 transition-colors duration-200">
                  Remember me
                </label>
              </div>
              <p
                onClick={() => navigate('/reset-password')}
                className="text-sm bg-transparent text-[#747baa] hover:text-[#4a507a] cursor-pointer transition-all duration-200 hover:scale-105"
              >
                Forgot password?
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-gradient-to-r from-[#489065] to-[#2e5b40] text-white py-4 rounded-xl font-semibold 
                         hover:from-[#2e5b40] hover:to-[#489065] transition-all duration-300 
                         transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                         ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
                         delay-800`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2 bg-transparent">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                <>Login<span className='text-xl bg-transparent ml-2'>🦥</span></>
              )}
            </button>

            <div className={`flex items-center bg-transparent transform transition-all duration-500 delay-900 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}>
              <hr className="flex-grow border-t border-gray-400" />
              <span className="mx-2 text-gray-500 text-sm bg-transparent">or</span>
              <hr className="flex-grow border-t border-gray-400" />
            </div>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className={`w-full bg-gradient-to-r from-[#656ca3] to-[#393d60] text-white py-4 rounded-xl font-semibold 
                         hover:from-[#393d60] hover:to-[#656ca3] transition-all duration-300 
                         transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl
                         ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
                         delay-1000`}
            >
              Sign Up<span className='text-xl bg-transparent ml-2'>🦥</span>
            </button>
          </form>
        </div>
      </div>

      {/* Custom CSS for gradient animation  */}
      <style>{`
          @keyframes gradient {
            0%, 100% {
              background-size: 200% 200%;
              background-position: left center;
            }
            50% {
              background-size: 200% 200%;
              background-position: right center;
            }
          }
          
          .animate-gradient {
            animation: gradient 3s ease infinite;
          }

          .delay-100 {
            animation-delay: 100ms;
          }
          .delay-200 {
            animation-delay: 200ms;
          }
          .delay-300 {
            animation-delay: 300ms;
          }
          .delay-400 {
            animation-delay: 400ms;
          }
          .delay-500 {
            animation-delay: 500ms;
          }
          .delay-600 {
            animation-delay: 600ms;
          }
          .delay-700 {
            animation-delay: 700ms;
          }
          .delay-800 {
            animation-delay: 800ms;
          }
          .delay-900 {
            animation-delay: 900ms;
          }
          .delay-1000 {
            animation-delay: 1000ms;
          }
        `}</style>
    </div>
  )
}

export default LoginForm