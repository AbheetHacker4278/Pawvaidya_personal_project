import React, { useContext, useEffect, useState } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award, User, Mail, Phone, MapPin, Heart, CreditCard, Clock,
  RefreshCw, Shield, ChevronDown, ChevronUp, Calendar, Wallet,
  Star, Activity, Crown, Sparkles
} from 'lucide-react';

const DoctorVcoAssignment = () => {
  const { dtoken, profileData, getProfileData, getVcoClients, backendurl } = useContext(DoctorContext);
  const [vcoClients, setVcoClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedClient, setExpandedClient] = useState(null);

  const isVco = vcoClients.length > 0;

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!profileData) await getProfileData();
      const clients = await getVcoClients();
      setVcoClients(clients || []);
    } catch (err) {
      console.error('Error fetching VCO data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dtoken) fetchData();
  }, [dtoken]);

  const totalPets = vcoClients.reduce((sum, c) => sum + (c.pets?.length || 0), 0);
  const totalAppointments = vcoClients.reduce((sum, c) => sum + (c.appointments?.length || 0), 0);
  const completedAppointments = vcoClients.reduce((sum, c) =>
    sum + (c.appointments?.filter(a => a.status === 'Completed').length || 0), 0);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
          <RefreshCw className="w-8 h-8 text-amber-400" />
        </motion.div>
      </div>
    );
  }

  // Not a VCO
  if (!isVco) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg text-center bg-slate-900/80 border border-slate-700/50 rounded-2xl p-10 shadow-2xl"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center">
            <Shield className="w-10 h-10 text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-300 mb-3">No VCO Assignment</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            You are not currently assigned as a Dedicated Veterinary Care Officer (VCO) for any Obsidian Signature Pass member.
            Once an Obsidian user selects you as their dedicated VCO, their details will appear here.
          </p>
          <button onClick={fetchData} className="mt-6 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl border border-slate-600 transition-all flex items-center gap-2 mx-auto">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border border-amber-500/30 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Crown className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-amber-100 tracking-tight">
                    Dedicated VCO Assignment
                  </h1>
                  <p className="text-amber-200/60 text-sm mt-1">
                    Your Obsidian Signature Pass clients and concierge dashboard
                  </p>
                </div>
              </div>
              <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-300 text-sm font-semibold transition-all">
                <RefreshCw className="w-4 h-4" /> Refresh Data
              </button>
            </div>

            {/* Doctor VCO Profile Card */}
            {profileData && (
              <div className="mt-6 flex flex-col md:flex-row items-start md:items-center gap-4 bg-slate-950/60 border border-amber-500/10 rounded-xl p-4">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-amber-500 bg-slate-800 shrink-0">
                  {profileData.image ? (
                    <img src={profileData.image} alt={profileData.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-amber-400"><User className="w-7 h-7" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-amber-200">{profileData.name}</h3>
                  <p className="text-xs text-amber-200/50">{profileData.speciality} · {profileData.experience}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 font-bold uppercase tracking-wider">
                      Verified VCO
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                      {vcoClients.length} Active {vcoClients.length === 1 ? 'Client' : 'Clients'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Obsidian Clients', value: vcoClients.length, icon: Crown, color: 'amber' },
          { label: 'Pets Under Care', value: totalPets, icon: Heart, color: 'rose' },
          { label: 'Total Consults', value: totalAppointments, icon: Calendar, color: 'blue' },
          { label: 'Completed', value: completedAppointments, icon: Activity, color: 'emerald' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900/80 border border-amber-500/10 rounded-xl p-4 text-center">
            <stat.icon className={`w-5 h-5 mx-auto mb-2 text-${stat.color}-400`} />
            <p className="text-2xl font-black text-amber-100">{stat.value}</p>
            <p className="text-[10px] text-amber-200/50 uppercase tracking-wider font-semibold mt-1">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Client Cards */}
      <div className="space-y-6">
        {vcoClients.map((client, idx) => {
          const isExpanded = expandedClient === client._id;
          const creditAvailable = (client.creditLine?.limit || 0) - (client.creditLine?.spent || 0);
          const creditUsagePercent = client.creditLine?.limit ? Math.min(100, ((client.creditLine.spent || 0) / client.creditLine.limit) * 100) : 0;

          return (
            <motion.div
              key={client._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="bg-slate-900/80 border border-amber-500/20 hover:border-amber-500/40 rounded-2xl overflow-hidden shadow-xl transition-all duration-300"
            >
              {/* Client Header - always visible */}
              <div
                className="p-5 md:p-6 cursor-pointer"
                onClick={() => setExpandedClient(isExpanded ? null : client._id)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-amber-500 bg-slate-800">
                        {client.image ? (
                          <img src={client.image} alt={client.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-amber-400"><User className="w-7 h-7" /></div>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shadow-md">👑</div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-amber-100">{client.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 font-bold uppercase tracking-wider">
                          Obsidian {client.subscription?.plan || 'Signature'}
                        </span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                          {client.subscription?.status || 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Quick stats chips */}
                    <div className="hidden md:flex items-center gap-2 text-xs">
                      <span className="bg-slate-950 border border-amber-500/10 px-3 py-1.5 rounded-lg text-amber-200/70">
                        {client.pets?.length || 0} Pets
                      </span>
                      <span className="bg-slate-950 border border-amber-500/10 px-3 py-1.5 rounded-lg text-amber-200/70">
                        {client.appointments?.length || 0} Visits
                      </span>
                      <span className="bg-slate-950 border border-amber-500/10 px-3 py-1.5 rounded-lg text-amber-200/70">
                        ₹{(client.pawWallet || 0).toLocaleString('en-IN')} Wallet
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-amber-400" /> : <ChevronDown className="w-5 h-5 text-amber-400" />}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 md:px-6 pb-6 border-t border-amber-500/10 pt-6">
                      {/* Contact Info */}
                      <div className="flex flex-wrap gap-3 mb-6 text-xs">
                        <div className="flex items-center gap-2 bg-slate-950 border border-amber-500/10 px-3 py-2 rounded-lg text-amber-200/70">
                          <Mail className="w-3.5 h-3.5 text-amber-400" /> {client.email}
                        </div>
                        <div className="flex items-center gap-2 bg-slate-950 border border-amber-500/10 px-3 py-2 rounded-lg text-amber-200/70">
                          <Phone className="w-3.5 h-3.5 text-amber-400" />
                          {client.phone ? (typeof client.phone === 'object' ? `${client.phone.code || '+91'} ${client.phone.number || ''}` : client.phone) : 'N/A'}
                        </div>
                        {client.address && (
                          <div className="flex items-center gap-2 bg-slate-950 border border-amber-500/10 px-3 py-2 rounded-lg text-amber-200/70 max-w-xs">
                            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">{typeof client.address === 'object' ? `${client.address.line || ''} ${client.address.Location || ''}` : client.address}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 bg-slate-950 border border-amber-500/10 px-3 py-2 rounded-lg text-amber-200/70">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" /> Joined: {new Date(client.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {/* 3-Panel Grid */}
                      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                        {/* Panel 1: Wallet & Credit */}
                        <div className="bg-slate-950/80 border border-amber-500/10 rounded-xl p-5 space-y-4">
                          <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2 border-b border-amber-500/10 pb-2">
                            <CreditCard className="w-4 h-4" /> Wallet & Credit Line
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-[10px] text-amber-200/50 block uppercase">PawWallet</span>
                              <span className="text-lg font-bold text-amber-200">₹{(client.pawWallet || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-amber-200/50 block uppercase">PawPoints</span>
                              <span className="text-lg font-bold text-amber-400">{(client.pawpoints || 0).toLocaleString('en-IN')} pts</span>
                            </div>
                          </div>

                          <div className="border-t border-amber-500/10 pt-3 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-amber-200/60">Credit Line:</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                client.creditLine?.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                client.creditLine?.status === 'Suspended' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                                'bg-slate-800 text-slate-400'
                              }`}>
                                {client.creditLine?.status || 'None'}
                              </span>
                            </div>

                            {client.creditLine && client.creditLine.status !== 'None' && (
                              <div className="space-y-2 bg-slate-900/60 p-3 rounded-lg border border-amber-500/5">
                                <div className="flex justify-between text-xs">
                                  <span className="text-amber-200/40">Limit:</span>
                                  <span className="font-semibold text-amber-200">₹{(client.creditLine.limit || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-amber-200/40">Spent:</span>
                                  <span className="font-semibold text-rose-400">₹{(client.creditLine.spent || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between text-xs font-semibold border-t border-amber-500/10 pt-1.5">
                                  <span className="text-amber-300/80">Available:</span>
                                  <span className="text-emerald-400">₹{creditAvailable.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-1 border border-amber-500/10">
                                  <div className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full" style={{ width: `${creditUsagePercent}%` }} />
                                </div>
                                {client.creditLine.repaymentDeadline && (
                                  <div className="flex items-center gap-1.5 text-[10px] text-amber-200/50 mt-1">
                                    <Clock className="w-3 h-3 text-amber-400" />
                                    Repay by: {new Date(client.creditLine.repaymentDeadline).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between text-xs border-t border-amber-500/10 pt-2">
                              <span className="text-amber-200/60">Emergency Dues:</span>
                              <span className={`font-semibold ${client.emergencyPaymentStatus === 'Pending Due Payment' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {client.emergencyPaymentStatus === 'Pending Due Payment' ? '⚠️ Outstanding' : '✅ Clear'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Panel 2: Pets */}
                        <div className="bg-slate-950/80 border border-amber-500/10 rounded-xl p-5 space-y-4">
                          <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2 border-b border-amber-500/10 pb-2">
                            <Heart className="w-4 h-4 text-rose-400" /> Pets Under Care ({client.pets?.length || 0})
                          </h4>
                          {(!client.pets || client.pets.length === 0) ? (
                            <div className="text-slate-500 text-xs italic py-8 text-center">No pets registered.</div>
                          ) : (
                            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                              {client.pets.map(pet => (
                                <div key={pet._id} className="bg-slate-900/60 border border-amber-500/5 hover:border-amber-500/20 rounded-lg p-3 flex gap-3 transition-all">
                                  <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-slate-800 border border-amber-500/20">
                                    {pet.image ? <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" /> : (
                                      <div className="w-full h-full flex items-center justify-center text-amber-500/40 bg-slate-950 text-[10px] font-bold">PET</div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-amber-300 truncate">{pet.name}</p>
                                    <p className="text-[11px] text-amber-200/50 capitalize">{pet.petType} · {pet.breed || 'N/A'}</p>
                                    <p className="text-[10px] text-amber-200/40">Age: {pet.age} yrs · {pet.gender}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Panel 3: Appointments */}
                        <div className="bg-slate-950/80 border border-amber-500/10 rounded-xl p-5 space-y-4">
                          <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2 border-b border-amber-500/10 pb-2">
                            <Clock className="w-4 h-4 text-amber-400" /> Appointment History ({client.appointments?.length || 0})
                          </h4>
                          {(!client.appointments || client.appointments.length === 0) ? (
                            <div className="text-slate-500 text-xs italic py-8 text-center">No consultations yet.</div>
                          ) : (
                            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                              {client.appointments.map(appt => (
                                <div key={appt._id} className="bg-slate-900/60 border border-amber-500/5 p-3 rounded-lg space-y-1.5 text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-amber-200">
                                      {new Date(appt.slotDate).toLocaleDateString()} · {appt.slotTime}
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      appt.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' :
                                      appt.status === 'Cancelled' ? 'bg-rose-500/20 text-rose-400' :
                                      'bg-amber-500/20 text-amber-400'
                                    }`}>
                                      {appt.status}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-[11px] text-amber-200/60">
                                    <span>Type:</span>
                                    <span className="text-amber-300 font-medium">
                                      {appt.isVcoBooking ? `VCO ${appt.vcoVisitType || 'Visit'}` : 'Standard'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-[11px] text-amber-200/60">
                                    <span>Amount:</span>
                                    <span className="text-amber-100 font-medium">₹{appt.amount}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default DoctorVcoAssignment;
