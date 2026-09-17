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
  Landmark
} from 'lucide-react';
import { store } from '../services/store';
import { UserRole } from '../types';

interface OfficialAuthPortalProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export const OfficialAuthPortal: React.FC<OfficialAuthPortalProps> = ({ onSuccess, onCancel }) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // Sign In State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Sign Up State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('ENTITY_OFFICER');
  const [signupEntityId, setSignupEntityId] = useState(store.entities[0].id);
  const [signupDesignation, setSignupDesignation] = useState('');
  const [signupStaffId, setSignupStaffId] = useState('');
  const [signupError, setSignupError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginEmail.trim()) {
      setLoginError('Please enter your official government or institutional email address.');
      return;
    }

    if (!loginPassword) {
      setLoginError('Please enter your official security password.');
      return;
    }

    const result = store.login(loginEmail.trim(), loginPassword);
    if (result.success) {
      onSuccess();
    } else {
      setLoginError(result.message || 'Authentication failed. Please verify your credentials or register an official account.');
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setSignupError('Please complete all required fields.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters in length.');
      return;
    }

    const selectedEntity = store.entities.find(e => e.id === signupEntityId);

    const result = store.signUp({
      name: signupName.trim(),
      email: signupEmail.trim(),
      role: signupRole,
      designation: signupDesignation.trim() || (signupRole === 'DSAC_ADMIN' ? 'Oversight Administrator' : 'Senior Reporting Officer'),
      entityId: signupRole === 'ENTITY_OFFICER' ? signupEntityId : undefined,
      entityName: signupRole === 'ENTITY_OFFICER' && selectedEntity ? selectedEntity.name : 'DSAC National Headquarters',
      password: signupPassword.trim(),
    });

    if (result.success) {
      onSuccess();
    } else {
      setSignupError(result.message || 'Registration could not be completed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-8 relative selection:bg-emerald-600 selection:text-white">
      
      {/* Background National Subtle Heraldic Watermark */}
      <div className="absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>

      <div className="max-w-xl w-full relative z-10">
        
        {/* Official Header Banner */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Landmark className="w-3.5 h-3.5" />
            <span>Republic of South Africa</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-['Cabinet_Grotesk']">
            Department of Sport, Arts and Culture
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">
            Public Entities & NPOs Statutory Performance Reporting System (PFMA Section 38)
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md">
          
          {/* Tabs: Sign In / Sign Up */}
          <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-xl border border-slate-800 mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setLoginError(null);
              }}
              className={`py-2.5 rounded-lg transition-all ${
                activeTab === 'signin'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Official Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('signup');
                setSignupError(null);
              }}
              className={`py-2.5 rounded-lg transition-all ${
                activeTab === 'signup'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register Official Account
            </button>
          </div>

          {/* TAB 1: SIGN IN FORM */}
          {activeTab === 'signin' && (
            <div className="space-y-5">
              <form onSubmit={handleSignIn} className="space-y-4 text-xs">
                
                {loginError && (
                  <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 flex items-start gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Official Government / Institutional Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      required
                      type="email"
                      placeholder="e.g. sakhilesicelo94@gmail.com or kmokoena@sahra.org.za"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-slate-300">
                      Official Password
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg shadow-emerald-950 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                  >
                    <span>Sign In to Government System</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Secure Statutory Session Notice */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>PFMA Protected Statutory Gateway</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signup');
                    setSignupError(null);
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  New Official? Register Account →
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SIGN UP / REGISTER FORM */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3.5 text-xs">
              
              {signupError && (
                <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{signupError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Full Legal Name & Surname *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Kagiso Mokoena"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Official Government / Entity Email *
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="e.g. kmokoena@sahra.org.za"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Institutional Role *
                  </label>
                  <select
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="ENTITY_OFFICER">Public Entity / NPO Reporting Officer</option>
                    <option value="DSAC_ADMIN">DSAC National Oversight Administrator</option>
                    <option value="DSAC_MANAGEMENT">DSAC Executive Management / Director-General</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Official Designation / Post Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Performance & Reporting Officer"
                    value={signupDesignation}
                    onChange={(e) => setSignupDesignation(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {signupRole === 'ENTITY_OFFICER' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Assigned Statutory Public Entity or Funded NPO *
                  </label>
                  <select
                    value={signupEntityId}
                    onChange={(e) => setSignupEntityId(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    {store.entities.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.shortCode}) - {e.cluster}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Password *
                  </label>
                  <input
                    required
                    type="password"
                    placeholder="At least 6 characters"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
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
                    placeholder="Re-enter password"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Employee / PERSAL / Institutional Reference Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. PERSAL 78492014 or SAHRA-EMP-409"
                  value={signupStaffId}
                  onChange={(e) => setSignupStaffId(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                />
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  required
                  type="checkbox"
                  id="popia"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="popia" className="text-[11px] text-slate-400">
                  I certify that I am an authorized public sector reporting officer or departmental oversight official bound by the Public Finance Management Act (PFMA Act 1 of 1999) and POPIA statutory confidentiality.
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg shadow-emerald-950 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>Register & Open Oversight Session</span>
                </button>
              </div>
            </form>
          )}

          {/* Footer security badge */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>National Department of Sport, Arts and Culture (DSAC)</span>
            </span>
            <span className="font-mono">PFMA Vote 37 Compliant</span>
          </div>

        </div>

        {onCancel && store.currentUser && (
          <div className="text-center mt-4">
            <button
              onClick={onCancel}
              className="text-xs text-slate-400 hover:text-white transition-colors underline"
            >
              Return to Active Oversight Session ({store.currentUser.name})
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
