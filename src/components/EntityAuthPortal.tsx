import React, { useState } from 'react';
import {
  Theater,
  Building2,
  Lock,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  Sparkles,
  Layers,
  MapPin,
  FileText,
  X,
  BadgeCheck
} from 'lucide-react';
import { store } from '../services/store';
import { DEMO_MODE, DEMO_PASSWORD, DEMO_DSAC_ADMIN_EMAIL } from '../config/demoMode';
import { EntityType, EntityCluster } from '../types';
import { UbuntuArtsLogo } from './UbuntuArtsLogo';
import { SouthAfricanCoatOfArms } from './SouthAfricanCoatOfArms';

interface EntityAuthPortalProps {
  onSuccess: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  isOpen?: boolean;
  onSwitchToOfficialAuth?: () => void;
  initialMode?: 'signin' | 'signup' | 'dsac';
}

export const EntityAuthPortal: React.FC<EntityAuthPortalProps> = ({
  onSuccess,
  onCancel,
  onClose,
  isOpen = true,
  onSwitchToOfficialAuth,
  initialMode = 'signin',
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'dsac'>(initialMode);

  if (isOpen === false) return null;

  const handleClose = onClose || onCancel;

  // Sign In State
  const [loginEmail, setLoginEmail] = useState(DEMO_MODE ? 'l.phiri@ubuntuarts.org.za' : '');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Sign Up State
  const [entityName, setEntityName] = useState('');
  const [entityType, setEntityType] = useState<EntityType>('NPO');
  const [cluster, setCluster] = useState<EntityCluster>('Subsidized Cultural NPOs');
  const [cipcNumber, setCipcNumber] = useState('');
  const [province, setProvince] = useState('Gauteng');
  const [accountingOfficer, setAccountingOfficer] = useState('');
  const [designation, setDesignation] = useState('Chief Executive Officer / Director');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [budgetAllocation, setBudgetAllocation] = useState('');
  const [acceptedPfma, setAcceptedPfma] = useState(true);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-configured Quick Demo Logins
  const quickDemoAccounts = [
    {
      label: 'Ubuntu Arts NPO',
      name: 'Lerato Phiri',
      role: 'Organisation Admin',
      email: 'l.phiri@ubuntuarts.org.za',
      password: DEMO_PASSWORD,
      badge: 'Subsidized NPO',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      label: 'SAHRA (Heritage)',
      name: 'Kagiso Mokoena',
      role: 'Chief Performance & Reporting Officer',
      email: 'kmokoena@sahra.org.za',
      password: DEMO_PASSWORD,
      badge: 'Schedule 3A',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      label: 'National Arts Council',
      name: 'Palesa Dlamini',
      role: 'Finance & Compliance',
      email: 'p.dlamini@nac.org.za',
      password: DEMO_PASSWORD,
      badge: 'Statutory Body',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      label: 'DSAC Oversight Headquarters',
      name: 'Sicelo Sakhile Mkhize',
      role: 'Chief Director: Oversight',
      email: DEMO_DSAC_ADMIN_EMAIL,
      password: DEMO_PASSWORD,
      badge: 'DSAC Admin',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
  ];

  const handleEntityLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginEmail.trim()) {
      setLoginError('Please enter your registered institutional email address.');
      return;
    }

    if (!loginPassword) {
      setLoginError('Please enter your portal password.');
      return;
    }

    const result = store.login(loginEmail.trim(), loginPassword);
    if (result.success) {
      onSuccess();
    } else {
      setLoginError(result.message || 'Authentication failed. Please verify credentials or register.');
    }
  };

  const handleQuickLogin = (email: string, pass: string) => {
    setLoginEmail(email);
    setLoginPassword(pass);
    const result = store.login(email, pass);
    if (result.success) {
      onSuccess();
    } else {
      setLoginError(result.message || 'Quick login failed.');
    }
  };

  const handleEntitySignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    if (!entityName.trim()) {
      setSignupError('Please enter the official name of the Entity or NPO.');
      return;
    }

    if (!accountingOfficer.trim()) {
      setSignupError('Please enter the name of the Accounting Officer or Executive Director.');
      return;
    }

    if (!signupEmail.trim()) {
      setSignupError('Please provide an official organizational email address.');
      return;
    }

    if (!signupPassword) {
      setSignupError('Please create a password for your account.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match. Please re-enter.');
      return;
    }

    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters.');
      return;
    }

    if (!acceptedPfma) {
      setSignupError('You must acknowledge statutory compliance with PFMA Section 38.');
      return;
    }

    setIsSubmitting(true);

    try {
      const budgetNum = Math.max(0, parseFloat(budgetAllocation) || 0);

      const result = store.registerEntityAndUser({
        entityName: entityName.trim(),
        entityType,
        cluster,
        cipcNumber: cipcNumber.trim() || `NPO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        accountingOfficer: accountingOfficer.trim(),
        email: signupEmail.trim(),
        password: signupPassword.trim(),
        province,
        allocatedBudgetZAR: budgetNum,
        designation: designation.trim() || 'Organisation Administrator',
      });

      if (result.success) {
        onSuccess();
      } else {
        setSignupError(result.message || 'Could not complete registration.');
      }
    } catch (err: any) {
      setSignupError(err?.message || 'An unexpected error occurred during registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const provinces = [
    'Gauteng',
    'Western Cape',
    'KwaZulu-Natal',
    'Eastern Cape',
    'Free State',
    'Limpopo',
    'Mpumalanga',
    'North West',
    'Northern Cape',
  ];

  const clusters: EntityCluster[] = [
    'Subsidized Cultural NPOs',
    'Performing Arts & Theatres',
    'Heritage & Museums',
    'Creative Industries & Film',
    'Language & Literature',
    'Sport & Recreation',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden my-6">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative">
          {handleClose && (
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3.5 mb-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-900/80 border border-indigo-400/30 flex items-center justify-center p-2 shadow-inner">
              <UbuntuArtsLogo size={36} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Statutory Entity &amp; NPO Portal
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  PFMA Vote 37
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Entity Access &amp; Registration
              </h2>
            </div>
          </div>

          <p className="text-xs text-slate-300">
            Official statutory self-reporting portal for all 26 Public Entities and 6 subsidized Non-Profit Organisations.
          </p>

          {/* Tab Selector */}
          <div className="grid grid-cols-2 p-1 bg-black/40 rounded-xl mt-4 border border-white/10 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setLoginError(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                activeTab === 'signin'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Entity Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('signup');
                setSignupError(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                activeTab === 'signup'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Register New Entity / NPO
            </button>
          </div>
        </div>

        {/* TAB 1: ENTITY SIGN IN */}
        {activeTab === 'signin' && (
          <div className="p-6 space-y-5">
            <form onSubmit={handleEntityLogin} className="space-y-4 text-xs">
              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Entity / Institutional Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    required
                    type="email"
                    placeholder="e.g. l.phiri@ubuntuarts.org.za or sipho@sahra.org.za"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Security Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-indigo-600" />
                  <span>Remember this terminal</span>
                </label>
                <span className="text-indigo-600 hover:underline cursor-pointer">
                  Need access assistance?
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <span>Sign In to Entity Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick 1-Click Demo Profiles */}
            <div className={`pt-4 border-t border-slate-200 ${DEMO_MODE ? '' : 'hidden'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  1-Click Instant Demo Login
                </span>
                <span className="text-[10px] text-indigo-600 font-medium">Auto-populates session</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickDemoAccounts.map((demo) => (
                  <button
                    key={demo.email}
                    type="button"
                    onClick={() => handleQuickLogin(demo.email, demo.password)}
                    className="text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-300 transition-all flex flex-col justify-between group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900 group-hover:text-indigo-900">
                        {demo.label}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${demo.badgeColor}`}>
                        {demo.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 truncate">{demo.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{demo.email}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REGISTER NEW ENTITY OR NPO */}
        {activeTab === 'signup' && (
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <form onSubmit={handleEntitySignUp} className="space-y-4 text-xs">
              {signupError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{signupError}</span>
                </div>
              )}

              {/* Section 1: Entity Details */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-indigo-950 uppercase tracking-wider pb-1 border-b border-slate-200 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>1. Institutional &amp; Statutory Profile</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Entity / NPO Name *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Ubuntu Arts Community Collective"
                    value={entityName}
                    onChange={(e) => setEntityName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Statutory Classification *
                    </label>
                    <select
                      value={entityType}
                      onChange={(e) => setEntityType(e.target.value as EntityType)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                    >
                      <option value="NPO">Non-Profit Organisation (NPO)</option>
                      <option value="PUBLIC_ENTITY">Schedule 3A Public Entity</option>
                      <option value="PUBLIC_ENTITY">Schedule 3C Provincial Entity</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      CIPC / NPO Registration Number *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. NPO-2024-8891 or 2018/142981/08"
                      value={cipcNumber}
                      onChange={(e) => setCipcNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Portfolio Cluster *
                    </label>
                    <select
                      value={cluster}
                      onChange={(e) => setCluster(e.target.value as EntityCluster)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                    >
                      {clusters.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Headquarters Province *
                    </label>
                    <select
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                    >
                      {provinces.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Annual DSAC Support / Budget Allocation (ZAR)
                  </label>
                  <input
                    type="number"
                    placeholder="Budget you are requesting (optional)"
                    value={budgetAllocation}
                    onChange={(e) => setBudgetAllocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Reflects National Treasury Vote 37 statutory baseline allocation.
                  </p>
                </div>
              </div>

              {/* Section 2: Reporting Officer & Credentials */}
              <div className="space-y-3 pt-3">
                <div className="text-xs font-bold text-indigo-950 uppercase tracking-wider pb-1 border-b border-slate-200 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>2. Accounting Officer / Authorized Representative</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Officer Full Name *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Lerato Phiri"
                      value={accountingOfficer}
                      onChange={(e) => setAccountingOfficer(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Official Designation *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Chief Executive Officer"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Official Reporting Email *
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="e.g. director@ubuntuarts.org.za"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Password (min 6 chars) *
                    </label>
                    <input
                      required
                      type="password"
                      placeholder="••••••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Confirm Password *
                    </label>
                    <input
                      required
                      type="password"
                      placeholder="••••••••••••"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden font-mono"
                    />
                  </div>
                </div>

                {/* PFMA Statutory Affirmation */}
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedPfma}
                      onChange={(e) => setAcceptedPfma(e.target.checked)}
                      className="mt-0.5 rounded border-indigo-400 text-indigo-700"
                    />
                    <span className="text-[11px] text-slate-700 leading-tight">
                      I affirm that this organization will comply with the statutory provisions of the 
                      <strong> Public Finance Management Act (PFMA Act 1 of 1999) Section 38</strong>, submitting quarterly performance data and evidence to DSAC.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <BadgeCheck className="w-4 h-4 text-amber-300" />
                  <span>{isSubmitting ? 'Registering Entity...' : 'Complete Registration & Open Portal'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bottom Switcher to DSAC Official Auth */}
        {onSwitchToOfficialAuth && (
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-600">
            <span>DSAC Official / Administrator?</span>
            <button
              type="button"
              onClick={onSwitchToOfficialAuth}
              className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 transition-colors"
            >
              <span>Switch to DSAC Official Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
