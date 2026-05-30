import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { X, Globe, Shield, RefreshCw } from 'lucide-react';

const SocialAuthModal = ({ isOpen, onClose, provider, backendurl, onAuthSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [linkingAccount, setLinkingAccount] = useState(null);
  const [developerBypassOpen, setDeveloperBypassOpen] = useState(false);

  // Manual fallback inputs (only displayed if user chooses sandbox bypass)
  const [sandboxEmail, setSandboxEmail] = useState('');
  const [sandboxName, setSandboxName] = useState('');

  useEffect(() => {
    // Dynamically load Google Identity Services if not already present
    if (isOpen && !window.google) {
      const script = document.createElement('script');
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setLinkingAccount(null);
      setDeveloperBypassOpen(false);
      setSandboxEmail('');
      setSandboxName('');
      
      // Auto-trigger Google OAuth after a slight delay
      const timer = setTimeout(() => {
        triggerRealGoogleLogin();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const triggerRealGoogleLogin = () => {
    if (!window.google) {
      setErrorMsg("Google Identity Services script is still loading. Please try again.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "1047648485293-placeholderclientid.apps.googleusercontent.com";

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: async (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            try {
              // Fetch user info from Google's UserInfo API using native fetch to bypass axios global headers (e.g., location coordinates) that trigger CORS failures
              const userInfoRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenResponse.access_token}`);
              if (!userInfoRes.ok) {
                throw new Error(`Google UserInfo API returned status ${userInfoRes.status}`);
              }
              const userData = await userInfoRes.json();
              const { email, name, sub } = userData;

              // Send real profile data to the backend social-auth endpoint
              await handleBackendSocialAuth(email, name, sub);
            } catch (error) {
              console.error("Google UserInfo error:", error);
              setErrorMsg(error.response?.data?.message || error.message || "Failed to fetch user profile from Google.");
              setIsLoading(false);
            }
          } else {
            setErrorMsg("Google authorization was not completed.");
            setIsLoading(false);
          }
        },
        error_callback: (err) => {
          setErrorMsg(err.message || "An error occurred during Google OAuth.");
          setIsLoading(false);
        }
      });

      client.requestAccessToken();
    } catch (err) {
      console.error("GIS client init error:", err);
      setErrorMsg(err.message || "Failed to initialize Google login client.");
      setIsLoading(false);
    }
  };

  const handleBackendSocialAuth = async (email, name, providerId) => {
    setIsLoading(true);
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(`${backendurl}/api/user/social-auth`, {
        email,
        name,
        provider: 'google',
        providerId
      });

      if (data.success) {
        toast.success(`Successfully logged in via Google!`);
        onAuthSuccess(data);
        onClose();
      } else if (data.accountExists) {
        setLinkingAccount({
          email: data.email,
          provider: data.provider,
          providerId: data.providerId,
          name: data.name,
          message: data.message
        });
      } else {
        setErrorMsg(data.message || "Social authentication failed on server.");
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.message || error.message || "Server connection error.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkAccount = async () => {
    if (!linkingAccount) return;
    setIsLoading(true);
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(`${backendurl}/api/user/link-social-account`, {
        email: linkingAccount.email,
        provider: 'google',
        providerId: linkingAccount.providerId
      });

      if (data.success) {
        toast.success(`Successfully connected accounts and logged in!`);
        onAuthSuccess(data);
        onClose();
      } else {
        toast.error(data.message || "Linking failed.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Linking failed.");
    } finally {
      setIsLoading(false);
      setLinkingAccount(null);
    }
  };

  const handleSandboxSubmit = (e) => {
    e.preventDefault();
    if (!sandboxEmail || !sandboxName) {
      toast.error("Please enter email and name for sandbox simulation.");
      return;
    }
    const mockId = `google_sandbox_${Math.random().toString(36).substring(2, 10)}`;
    handleBackendSocialAuth(sandboxEmail, sandboxName, mockId);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-amber-500/20 transition-all duration-300 transform scale-100 bg-white text-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-amber-500/10">
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-amber-600" />
            <span className="text-[10px] font-black tracking-widest uppercase opacity-85 text-neutral-500">
              Google Secure Login
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-amber-500/5 transition-colors text-neutral-500 hover:text-neutral-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Dynamic Inner Flow */}
        {linkingAccount ? (
          /* Connect Account Option */
          <div className="p-7 space-y-6 text-center bg-transparent">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-600 animate-bounce">
              <Shield size={30} />
            </div>

            <div className="space-y-2 bg-transparent">
              <h3 className="text-lg font-black text-[#5A4035]">Link Profile Required</h3>
              <p className="text-xs leading-relaxed px-2 bg-transparent text-gray-500">
                {linkingAccount.message}
              </p>
            </div>

            <div className="p-4 rounded-2xl text-left text-[11px] space-y-2 font-bold bg-neutral-50 border border-neutral-100">
              <div className="flex justify-between bg-transparent">
                <span className="opacity-70 bg-transparent">Email Address:</span>
                <span className="text-[#5A4035] bg-transparent">{linkingAccount.email}</span>
              </div>
              <div className="flex justify-between bg-transparent">
                <span className="opacity-70 bg-transparent">Social Network:</span>
                <span className="capitalize text-amber-600 bg-transparent">Google</span>
              </div>
            </div>

            <div className="space-y-2.5 bg-transparent">
              <button
                onClick={handleLinkAccount}
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md"
              >
                {isLoading ? 'Linking Profile...' : 'Yes, Connect & Login'}
              </button>
              <button
                type="button"
                onClick={() => setLinkingAccount(null)}
                className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border border-neutral-200 hover:bg-neutral-50 text-neutral-600"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : developerBypassOpen ? (
          /* Developer Sandbox Bypass Form */
          <form onSubmit={handleSandboxSubmit} className="p-7 space-y-5 bg-transparent">
            <div className="text-center bg-transparent py-1">
              <h3 className="text-md font-black uppercase tracking-wider text-amber-800">
                Sandbox Login Bypass
              </h3>
              <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wide">
                Bypass provider keys for local developer testing
              </p>
            </div>

            <div className="space-y-4 bg-transparent">
              <div className="bg-transparent">
                <label className="block text-[9px] font-black uppercase tracking-wider mb-1.5 opacity-80">
                  Mock Email Address
                </label>
                <input
                  type="email"
                  value={sandboxEmail}
                  onChange={(e) => setSandboxEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 rounded-2xl border text-xs font-bold focus:ring-2 focus:outline-none transition-all duration-200 border-neutral-200 focus:ring-amber-500/25 focus:border-amber-500 bg-neutral-50 text-neutral-800"
                  required
                />
              </div>

              <div className="bg-transparent">
                <label className="block text-[9px] font-black uppercase tracking-wider mb-1.5 opacity-80">
                  Mock Full Name
                </label>
                <input
                  type="text"
                  value={sandboxName}
                  onChange={(e) => setSandboxName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-2xl border text-xs font-bold focus:ring-2 focus:outline-none transition-all duration-200 border-neutral-200 focus:ring-amber-500/25 focus:border-amber-500 bg-neutral-50 text-neutral-800"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 bg-transparent pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md"
              >
                {isLoading ? 'Authenticating...' : 'Authorize Sandbox Account'}
              </button>
              <button
                type="button"
                onClick={() => setDeveloperBypassOpen(false)}
                className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border border-neutral-200 hover:bg-neutral-50 text-neutral-600"
              >
                Back to Real Flow
              </button>
            </div>
          </form>
        ) : (
          /* Connecting Screen (Real Flow Loader) */
          <div className="p-7 space-y-6 text-center bg-transparent">
            {/* Animated Ring */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-transparent">
              <div className="absolute inset-0 rounded-full border-4 border-amber-500/10 border-t-amber-500 animate-spin"></div>
              <svg className="w-8 h-8 relative z-10 bg-transparent" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </div>

            <div className="space-y-1 bg-transparent">
              <h4 className="text-sm font-black text-[#5A4035]">
                {isLoading ? 'Contacting Google...' : 'Authorize Connection'}
              </h4>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wide">
                A secure login popup will launch
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-500/5 border border-red-500/20 text-red-600 rounded-2xl text-[10px] font-bold text-left leading-relaxed">
                {errorMsg}
              </div>
            )}

            <div className="space-y-2 bg-transparent pt-3">
              <button
                onClick={triggerRealGoogleLogin}
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
              >
                <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                {isLoading ? 'Waiting for Consent...' : 'Open Google Consent Dialog'}
              </button>

              <div className="flex items-center justify-between pt-2 bg-transparent">
                <button
                  type="button"
                  onClick={() => setDeveloperBypassOpen(true)}
                  className="text-[9px] font-black uppercase tracking-wider underline opacity-70 hover:opacity-100 bg-transparent text-amber-800"
                >
                  ⚙️ Developer Bypass (Sandbox)
                </button>
                
                <button
                  type="button"
                  onClick={onClose}
                  className="text-[9px] font-black uppercase tracking-wider opacity-60 hover:opacity-100 bg-transparent"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialAuthModal;
