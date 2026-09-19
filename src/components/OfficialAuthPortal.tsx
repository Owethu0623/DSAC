import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Mail, 
  User, 
  Building2, 
  CheckCircle2, 
  ArrowRight, 
  Key, 
  AlertCircle,
  Eye,
  EyeOff,
  BadgeCheck,
  FileCheck2,
  Landmark,
  Layers,
  Sparkles,
  Briefcase,
  ChevronRight,
  ShieldCheck,
  MapPin,
  Coins
} from 'lucide-react';
import { store } from '../services/store';
import { DEMO_MODE, DEMO_PASSWORD, DEMO_DSAC_ADMIN_EMAIL } from '../config/demoMode';
import { UserRole, EntityType, EntityCluster } from '../types';
import { SouthAfricanCoatOfArms } from './SouthAfricanCoatOfArms';
import { UbuntuArtsLogo } from './UbuntuArtsLogo';

interface OfficialAuthPortalProps {
  onSuccess: () => void;
  onCancel?: () => void;
  initialPortal?: 'dsac' | 'entity';
}

export const OfficialAuthPortal: React.FC<OfficialAuthPortalProps> = ({ 
  onSuccess, 
  onCancel,
  initialPortal = 'dsac'
}) => {
  // Top-level portal switch: DSAC National Oversight vs Public Entities & Funded NPOs
  const [portalType, setPortalType] = useState<'dsac' | 'entity'>(initialPortal);

  // Sub-tabs for each portal: signin vs signup
  const [dsacSubTab, setDsacSubTab] = useState<'signin' | 'signup'>('signin');
  const [entitySubTab, setEntitySubTab] = useState<'signin' | 'signup'>('signin');

  // --- DSAC SIGN IN STATE ---
  const [dsacEmail, setDsacEmail] = useState(DEMO_MODE ? DEMO_DSAC_ADMIN_EMAIL : '');
  const [dsacPassword, setDsacPassword] = useState(DEMO_MODE ? DEMO_PASSWORD : '');
  const [showDsacPassword, setShowDsacPassword] = useState(false);
  const [dsacLoginError, setDsacLoginError] = useState<string | null>(null);

  // --- DSAC SIGN UP STATE ---
  const [dsacSignupName, setDsacSignupName] = useState('');
  const [dsacSignupEmail, setDsacSignupEmail] = useState('');
  const [dsacSignupPassword, setDsacSignupPassword] = useState('');
  const [dsacSignupConfirmPassword, setDsacSignupConfirmPassword] = useState('');
  const [dsacSignupRole, setDsacSignupRole] = useState<UserRole>('DSAC_ADMIN');
  const [dsacSignupDesignation, setDsacSignupDesignation] = useState('');
  const [dsacSignupStaffId, setDsacSignupStaffId] = useState('');
  const [dsacSignupError, setDsacSignupError] = useState<string | null>(null);
  const [dsacAcceptedTerms, setDsacAcceptedTerms] = useState(true);

  // --- ENTITY SIGN IN STATE ---
  const [entityEmail, setEntityEmail] = useState(DEMO_MODE ? 'l.phiri@ubuntuarts.org.za' : '');
  const [entityPassword, setEntityPassword] = useState(DEMO_MODE ? DEMO_PASSWORD : '');
  const [showEntityPassword, setShowEntityPassword] = useState(false);
  const [entityLoginError, setEntityLoginError] = useState<string | null>(null);

  // --- ENTITY SIGN UP STATE ---
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityType, setNewEntityType] = useState<EntityType>('NPO');
  const [newEntityCluster, setNewEntityCluster] = useState<EntityCluster>('Subsidized Cultural NPOs');
  const [newEntityCipc, setNewEntityCipc] = useState('');
  const [newEntityProvince, setNewEntityProvince] = useState('Gauteng');
  const [newAccountingOfficer, setNewAccountingOfficer] = useState('');
  const [newDesignation, setNewDesignation] = useState('Chief Executive Officer / Director');
  const [entitySignupEmail, setEntitySignupEmail] = useState('');
  const [entitySignupPassword, setEntitySignupPassword] = useState('');
  const [entitySignupConfirmPassword, setEntitySignupConfirmPassword] = useState('');
  const [newBudgetAllocation, setNewBudgetAllocation] = useState('');
  const [entityAcceptedPfma, setEntityAcceptedPfma] = useState(true);
  const [entitySignupError, setEntitySignupError] = useState<string | null>(null);
  const [isSubmittingEntity, setIsSubmittingEntity] = useState(false);

  // Handler for DSAC sign in
  const handleDsacSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setDsacLoginError(null);

    if (!dsacEmail.trim()) {
      setDsacLoginError('Please enter your official DSAC departmental email address.');
      return;
    }

    if (!dsacPassword) {
      setDsacLoginError('Please enter your official security password.');
      return;
    }

    const result = store.login(dsacEmail.trim(), dsacPassword);
    if (result.success) {
      onSuccess();
    } else {
      setDsacLoginError(result.message || 'Authentication failed. Please verify credentials.');
    }
  };

  // Handler for Entity sign in
  const handleEntitySignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setEntityLoginError(null);

    if (!entityEmail.trim()) {
      setEntityLoginError('Please enter your registered institutional email address.');
      return;
    }

    if (!entityPassword) {
      setEntityLoginError('Please enter your entity portal password.');
      return;
    }

    const result = store.login(entityEmail.trim(), entityPassword);
    if (result.success) {
      onSuccess();
    } else {
      setEntityLoginError(result.message || 'Entity authentication failed. Please check credentials or register.');
    }
  };

  // Handler for DSAC official registration
  const handleDsacSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setDsacSignupError(null);

    if (!dsacSignupName.trim() || !dsacSignupEmail.trim() || !dsacSignupPassword.trim()) {
      setDsacSignupError('Please complete all required fields.');
      return;
    }

    if (dsacSignupPassword !== dsacSignupConfirmPassword) {
      setDsacSignupError('Passwords do not match. Please re-enter.');
      return;
    }

    if (dsacSignupPassword.length < 6) {
      setDsacSignupError('Password must be at least 6 characters in length.');
      return;
    }

    const result = store.signUp({
      name: dsacSignupName.trim(),
      email: dsacSignupEmail.trim(),
      role: dsacSignupRole,
      designation: dsacSignupDesignation.trim() || (dsacSignupRole === 'DSAC_MANAGEMENT' ? 'Executive Director' : 'Oversight Administrator'),
      entityName: 'DSAC National Headquarters',
      password: dsacSignupPassword.trim(),
    });

    if (result.success) {
      onSuccess();
    } else {
      setDsacSignupError(result.message || 'Registration could not be completed.');
    }
  };

  // Handler for new Entity / NPO registration
  const handleEntitySignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setEntitySignupError(null);

    if (!newEntityName.trim() || !newAccountingOfficer.trim() || !entitySignupEmail.trim() || !entitySignupPassword) {
      setEntitySignupError('Please complete all mandatory institutional registration fields.');
      return;
    }

    if (entitySignupPassword !== entitySignupConfirmPassword) {
      setEntitySignupError('Passwords do not match. Please re-enter.');
      return;
    }

    if (entitySignupPassword.length < 6) {
      setEntitySignupError('Password must be at least 6 characters.');
      return;
    }

    if (!entityAcceptedPfma) {
      setEntitySignupError('You must certify statutory compliance with PFMA Section 38.');
      return;
    }

    setIsSubmittingEntity(true);

    try {
      const budgetNum = Math.max(0, parseFloat(newBudgetAllocation) || 0);
      const result = store.registerEntityAndUser({
        entityName: newEntityName.trim(),
        entityType: newEntityType,
        cluster: newEntityCluster,
        cipcNumber: newEntityCipc.trim() || `NPO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        accountingOfficer: newAccountingOfficer.trim(),
        email: entitySignupEmail.trim(),
        password: entitySignupPassword.trim(),
        province: newEntityProvince,
        allocatedBudgetZAR: budgetNum,
        designation: newDesignation.trim() || 'Chief Executive Officer',
      });

      if (result.success) {
        onSuccess();
      } else {
        setEntitySignupError(result.message || 'Registration failed.');
      }
    } catch (err: any) {
      setEntitySignupError(err?.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmittingEntity(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8 sm:py-12 relative selection:bg-emerald-600 selection:text-white">
      
      {/* Background Subtle Heraldic Watermark & Lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:28px_28px] opacity-10 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-80 bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-2xl w-full relative z-10">
        
        {/* National Crest & Sovereign Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="w-full max-w-xl rounded-[28px] border border-emerald-500/40 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.18)] p-4 sm:p-5 mb-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[22px] bg-emerald-900/80 border border-emerald-500/40 flex items-center justify-center p-2 shadow-lg">
                <SouthAfricanCoatOfArms size={84} variant="gold" />
              </div>

              <div className="space-y-1">
                <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.28em] text-emerald-300/90">
                  sport, arts &amp; culture
                </div>
                <div className="text-base sm:text-lg font-bold text-white leading-tight">
                  Department: Sport, Arts and Culture
                </div>
                <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.28em] text-emerald-400">
                  Republic of South Africa
                </div>
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-600/50 text-emerald-300 text-[11px] font-bold uppercase tracking-wider mb-2">
            <span>GovTrack SA</span>
            <span className="w-1 h-1 rounded-full bg-emerald-400" />
            <span>Simple access</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-['Cabinet_Grotesk']">
            Welcome to DSAC oversight
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-lg font-medium">
            Pick your portal, sign in, and open the dashboard in seconds.
          </p>
        </div>

        {/* PRIMARY PORTAL SELECTOR: DSAC vs PUBLIC ENTITIES & NPOs */}
        <div className="mb-5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between px-1">
            <span>Choose your portal</span>
            <span className="text-emerald-400 font-mono text-[10px]">Secure access</span>
          </div>

          <div className="mb-3 flex items-center gap-2 text-[10px] text-slate-400 justify-center sm:justify-start">
            <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>1. Select portal</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>2. Sign in</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>3. View status</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* PORTAL 1: DSAC OVERSIGHT */}
            <button
              type="button"
              onClick={() => {
                setPortalType('dsac');
                setDsacLoginError(null);
              }}
              className={`p-4 rounded-2xl text-left border transition-all relative overflow-hidden flex flex-col justify-between ${
                portalType === 'dsac'
                  ? 'bg-gradient-to-br from-emerald-950/90 via-slate-900 to-slate-950 border-emerald-500 shadow-xl shadow-emerald-950/50 ring-2 ring-emerald-500/50'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-400'
              }`}
            >
              {portalType === 'dsac' && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
              )}
              <div className="flex items-center justify-between mb-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                  portalType === 'dsac'
                    ? 'bg-emerald-900/80 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}>
                  <Landmark className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  portalType === 'dsac'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600/50'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  National Oversight
                </span>
              </div>
              <div>
                <h3 className={`font-bold text-sm leading-snug ${portalType === 'dsac' ? 'text-white' : 'text-slate-200'}`}>
                  DSAC National Logins
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                  Departmental Executives, Oversight Directorate &amp; PFMA Administrators.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                <span className={portalType === 'dsac' ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                  {portalType === 'dsac' ? '● Active Portal Selected' : 'Click to select'}
                </span>
                <ChevronRight className={`w-3.5 h-3.5 ${portalType === 'dsac' ? 'text-emerald-400' : 'text-slate-600'}`} />
              </div>
            </button>

            {/* PORTAL 2: ENTITIES & NPOs */}
            <button
              type="button"
              onClick={() => {
                setPortalType('entity');
                setEntityLoginError(null);
              }}
              className={`p-4 rounded-2xl text-left border transition-all relative overflow-hidden flex flex-col justify-between ${
                portalType === 'entity'
                  ? 'bg-gradient-to-br from-indigo-950/90 via-slate-900 to-slate-950 border-indigo-500 shadow-xl shadow-indigo-950/50 ring-2 ring-indigo-500/50'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-400'
              }`}
            >
              {portalType === 'entity' && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
              )}
              <div className="flex items-center justify-between mb-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                  portalType === 'entity'
                    ? 'bg-indigo-900/80 border-indigo-500/50 text-indigo-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  portalType === 'entity'
                    ? 'bg-indigo-950 text-indigo-300 border-indigo-600/50'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  26 PEs &amp; 6 NPOs
                </span>
              </div>
              <div>
                <h3 className={`font-bold text-sm leading-snug ${portalType === 'entity' ? 'text-white' : 'text-slate-200'}`}>
                  Entities &amp; NPOs Logins
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                  Public Entities, Theatres, Heritage Councils &amp; Subsidized Cultural NPOs.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                <span className={portalType === 'entity' ? 'text-indigo-400 font-semibold' : 'text-slate-500'}>
                  {portalType === 'entity' ? '● Active Portal Selected' : 'Click to select'}
                </span>
                <ChevronRight className={`w-3.5 h-3.5 ${portalType === 'entity' ? 'text-indigo-400' : 'text-slate-600'}`} />
              </div>
            </button>
          </div>
        </div>

        {/* AUTH CARD */}
        <div className="bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-7 backdrop-blur-md relative">
          
          {/* ========================================================================= */}
          {/* SECTION A: DSAC NATIONAL LOGINS                                           */}
          {/* ========================================================================= */}
          {portalType === 'dsac' && (
            <div className="space-y-5">
              
              {/* DSAC Banner */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    DSAC official access
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">National office</span>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <SouthAfricanCoatOfArms size={28} variant="gold" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-300/80">Secure access</p>
                    <p className="text-sm font-bold text-white truncate">Department of Sport, Arts and Culture</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-300 border border-emerald-500/40 bg-emerald-950/80 px-2 py-1 rounded-full">Official</span>
              </div>

              {/* Sub-tabs: Sign In vs Register DSAC */}
              <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setDsacSubTab('signin');
                    setDsacLoginError(null);
                  }}
                  className={`py-2 rounded-lg transition-all ${
                    dsacSubTab === 'signin'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDsacSubTab('signup');
                    setDsacSignupError(null);
                  }}
                  className={`py-2 rounded-lg transition-all ${
                    dsacSubTab === 'signup'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Create account
                </button>
              </div>

              {/* DSAC SIGN IN FORM */}
              {dsacSubTab === 'signin' && (
                <div className="space-y-4">
                  <form onSubmit={handleDsacSignIn} className="space-y-3.5 text-xs">
                    {dsacLoginError && (
                      <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <span>{dsacLoginError}</span>
                      </div>
                    )}

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1.5">
                        Email address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                        <input
                          required
                          type="email"
                          placeholder="e.g. official@dsac.gov.za"
                          value={dsacEmail}
                          onChange={(e) => setDsacEmail(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1.5">
                        Security Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                        <input
                          required
                          type={showDsacPassword ? 'text' : 'password'}
                          placeholder="••••••••••••"
                          value={dsacPassword}
                          onChange={(e) => setDsacPassword(e.target.value)}
                          className="w-full pl-9 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowDsacPassword(!showDsacPassword)}
                          className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                        >
                          {showDsacPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg shadow-emerald-950 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                      >
                        <span>Open dashboard</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>

                </div>
              )}

              {/* DSAC SIGN UP FORM */}
              {dsacSubTab === 'signup' && (
                <form onSubmit={handleDsacSignUp} className="space-y-3 text-xs">
                  {dsacSignupError && (
                    <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{dsacSignupError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Full Legal Name &amp; Surname *
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Sicelo Sakhile Mkhize"
                        value={dsacSignupName}
                        onChange={(e) => setDsacSignupName(e.target.value)}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Departmental Email Address *
                      </label>
                      <input
                        required
                        type="email"
                        placeholder="e.g. s.mkhize@dsac.gov.za"
                        value={dsacSignupEmail}
                        onChange={(e) => setDsacSignupEmail(e.target.value)}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Departmental Oversight Role *
                      </label>
                      <select
                        value={dsacSignupRole}
                        onChange={(e) => setDsacSignupRole(e.target.value as any)}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      >
                        <option value="DSAC_ADMIN">DSAC National Oversight Administrator</option>
                        <option value="DSAC_MANAGEMENT">DSAC Executive Management / Director-General</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Official Designation / Directorate
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Chief Director: Public Entities Governance"
                        value={dsacSignupDesignation}
                        onChange={(e) => setDsacSignupDesignation(e.target.value)}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Password (min 6 characters) *
                      </label>
                      <input
                        required
                        type="password"
                        placeholder="••••••••••••"
                        value={dsacSignupPassword}
                        onChange={(e) => setDsacSignupPassword(e.target.value)}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Confirm Password *
                      </label>
                      <input
                        required
                        type="password"
                        placeholder="••••••••••••"
                        value={dsacSignupConfirmPassword}
                        onChange={(e) => setDsacSignupConfirmPassword(e.target.value)}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      PERSAL Employee Reference Number (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="PERSAL number"
                      value={dsacSignupStaffId}
                      onChange={(e) => setDsacSignupStaffId(e.target.value)}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                    />
                  </div>

                  <div className="flex items-start gap-2 pt-1">
                    <input
                      required
                      type="checkbox"
                      id="dsac-popia"
                      checked={dsacAcceptedTerms}
                      onChange={(e) => setDsacAcceptedTerms(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="dsac-popia" className="text-[11px] text-slate-400">
                      I certify that I am a duly appointed official of the National Department of Sport, Arts and Culture bound by the Public Service Act and PFMA confidentiality.
                    </label>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg shadow-emerald-950 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                    >
                      <FileCheck2 className="w-4 h-4" />
                      <span>Register &amp; Open DSAC Session</span>
                    </button>
                  </div>
                </form>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION B: PUBLIC ENTITIES & FUNDED NPOs LOGINS                            */}
          {/* ========================================================================= */}
          {portalType === 'entity' && (
            <div className="space-y-5">
              
              {/* Entity Banner */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    Entity and NPO access
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Reporting portal</span>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center shrink-0">
                    <UbuntuArtsLogo size={28} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-indigo-300/80">Default institutional portal</p>
                    <p className="text-sm font-bold text-white truncate">Ubuntu Arts NPO</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-indigo-300 border border-indigo-500/40 bg-indigo-950/80 px-2 py-1 rounded-full">Ready</span>
              </div>

              {/* Sub-tabs: Entity Sign In vs Register Entity */}
              <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setEntitySubTab('signin');
                    setEntityLoginError(null);
                  }}
                  className={`py-2 rounded-lg transition-all ${
                    entitySubTab === 'signin'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEntitySubTab('signup');
                    setEntitySignupError(null);
                  }}
                  className={`py-2 rounded-lg transition-all ${
                    entitySubTab === 'signup'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Create account
                </button>
              </div>

              {/* ENTITY SIGN IN FORM */}
              {entitySubTab === 'signin' && (
                <div className="space-y-4">
                  <form onSubmit={handleEntitySignIn} className="space-y-3.5 text-xs">
                    {entityLoginError && (
                      <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <span>{entityLoginError}</span>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="font-semibold text-slate-300">
                          Institutional / Entity Email
                        </label>
                        <span className="text-[10px] text-indigo-400">e.g. Ubuntu Arts, SAHRA, NAC</span>
                      </div>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                        <input
                          required
                          type="email"
                          placeholder="e.g. l.phiri@ubuntuarts.org.za or sipho@sahra.org.za"
                          value={entityEmail}
                          onChange={(e) => setEntityEmail(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1.5">
                        Security Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                        <input
                          required
                          type={showEntityPassword ? 'text' : 'password'}
                          placeholder="••••••••••••"
                          value={entityPassword}
                          onChange={(e) => setEntityPassword(e.target.value)}
                          className="w-full pl-9 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowEntityPassword(!showEntityPassword)}
                          className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                        >
                          {showEntityPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-950 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                      >
                        <span>Open portal</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>

                </div>
              )}

              {/* ENTITY SIGN UP FORM */}
              {entitySubTab === 'signup' && (
                <form onSubmit={handleEntitySignUp} className="space-y-3.5 text-xs max-h-[60vh] overflow-y-auto pr-1">
                  {entitySignupError && (
                    <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{entitySignupError}</span>
                    </div>
                  )}

                  {/* Group 1: Institutional Data */}
                  <div className="space-y-2.5 pb-2 border-b border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>1. Institutional &amp; Statutory Details</span>
                    </span>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Entity / NPO Name *
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Ubuntu Arts Community Collective"
                        value={newEntityName}
                        onChange={(e) => setNewEntityName(e.target.value)}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">
                          Statutory Classification *
                        </label>
                        <select
                          value={newEntityType}
                          onChange={(e) => setNewEntityType(e.target.value as EntityType)}
                          className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        >
                          <option value="NPO">Subsidized Non-Profit Organisation (NPO)</option>
                          <option value="PUBLIC_ENTITY">Schedule 3A National Public Entity</option>
                          <option value="PUBLIC_ENTITY">Schedule 3C Provincial Public Entity</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">
                          CIPC / NPO Registration Number *
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. NPO-2024-8891 or 2018/142981/08"
                          value={newEntityCipc}
                          onChange={(e) => setNewEntityCipc(e.target.value)}
                          className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">
                          Portfolio Cluster *
                        </label>
                        <select
                          value={newEntityCluster}
                          onChange={(e) => setNewEntityCluster(e.target.value as EntityCluster)}
                          className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        >
                          <option value="Subsidized Cultural NPOs">Subsidized Cultural NPOs</option>
                          <option value="Performing Arts & Theatres">Performing Arts &amp; Theatres</option>
                          <option value="Heritage & Museums">Heritage &amp; Museums</option>
                          <option value="Creative Industries & Film">Creative Industries &amp; Film</option>
                          <option value="Language & Literature">Language &amp; Literature</option>
                          <option value="Sport & Recreation">Sport &amp; Recreation</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">
                          Province *
                        </label>
                        <select
                          value={newEntityProvince}
                          onChange={(e) => setNewEntityProvince(e.target.value)}
                          className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        >
                          <option value="Gauteng">Gauteng</option>
                          <option value="Western Cape">Western Cape</option>
                          <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                          <option value="Eastern Cape">Eastern Cape</option>
                          <option value="Free State">Free State</option>
                          <option value="Limpopo">Limpopo</option>
                          <option value="Mpumalanga">Mpumalanga</option>
                          <option value="North West">North West</option>
                          <option value="Northern Cape">Northern Cape</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Approved Annual Budget Allocation (ZAR)
                      </label>
                      <input
                        type="number"
                        placeholder="Budget you are requesting (optional)"
                        value={newBudgetAllocation}
                        onChange={(e) => setNewBudgetAllocation(e.target.value)}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                      />
                    </div>
                  </div>

                  {/* Group 2: Accounting Officer Credentials */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      <span>2. Accounting Officer / Authorized Representative</span>
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">
                          Officer Full Legal Name *
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Lerato Phiri"
                          value={newAccountingOfficer}
                          onChange={(e) => setNewAccountingOfficer(e.target.value)}
                          className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">
                          Official Designation *
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Chief Executive Officer"
                          value={newDesignation}
                          onChange={(e) => setNewDesignation(e.target.value)}
                          className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Reporting Email Address *
                      </label>
                      <input
                        required
                        type="email"
                        placeholder="e.g. director@ubuntuarts.org.za"
                        value={entitySignupEmail}
                        onChange={(e) => setEntitySignupEmail(e.target.value)}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">
                          Password (min 6 chars) *
                        </label>
                        <input
                          required
                          type="password"
                          placeholder="••••••••••••"
                          value={entitySignupPassword}
                          onChange={(e) => setEntitySignupPassword(e.target.value)}
                          className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">
                          Confirm Password *
                        </label>
                        <input
                          required
                          type="password"
                          placeholder="••••••••••••"
                          value={entitySignupConfirmPassword}
                          onChange={(e) => setEntitySignupConfirmPassword(e.target.value)}
                          className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-start gap-2 pt-1">
                      <input
                        required
                        type="checkbox"
                        id="entity-pfma"
                        checked={entityAcceptedPfma}
                        onChange={(e) => setEntityAcceptedPfma(e.target.checked)}
                        className="mt-0.5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="entity-pfma" className="text-[11px] text-slate-400">
                        I certify that this institution shall comply with statutory reporting provisions of the <strong>Public Finance Management Act (PFMA Act 1 of 1999) Section 38</strong>, submitting quarterly targets, financials, and verification portfolios.
                      </label>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmittingEntity}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-950 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                      >
                        <BadgeCheck className="w-4 h-4 text-amber-300" />
                        <span>{isSubmittingEntity ? 'Registering Entity...' : 'Register Entity & Open Reporting Portal'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

            </div>
          )}

          {/* Footer Statutory Note */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Department of Sport, Arts and Culture</span>
            </span>
            <span className="font-mono text-slate-400">Secure access portal</span>
          </div>

        </div>

        {/* Optional return to session if already logged in */}
        {onCancel && store.currentUser && (
          <div className="text-center mt-4">
            <button
              onClick={onCancel}
              className="text-xs text-slate-400 hover:text-white transition-colors underline"
            >
              Return to active session ({store.currentUser.name})
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
