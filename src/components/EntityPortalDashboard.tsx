import React, { useState } from 'react';
import {
  Theater,
  Calendar,
  AlertCircle,
  Target,
  Coins,
  CheckCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  HandCoins,
  BarChart3,
  UploadCloud,
  Bell,
  ChevronDown,
  Building,
  ShieldCheck,
  FolderLock,
  MessageSquare,
  HelpCircle,
  Plus,
  ArrowRight,
  ExternalLink,
  User,
  ChevronLeft,
  ChevronRight,
  X,
  Upload,
  Send,
  Download,
  FileCheck2,
  Briefcase,
  MapPin,
  Mail,
  Phone,
  Lock,
  Sparkles,
  Info,
  LogOut
} from 'lucide-react';
import { store } from '../services/store';
import { UbuntuArtsLogo } from './UbuntuArtsLogo';

interface EntityPortalDashboardProps {
  entityId?: string;
  onOpenWorkspace?: () => void;
  onNavigateToSection?: (section: string) => void;
  onLogout?: () => void;
}

export const EntityPortalDashboard: React.FC<EntityPortalDashboardProps> = ({
  entityId,
  onOpenWorkspace,
  onNavigateToSection,
  onLogout,
}) => {
  const [activeSidebar, setActiveSidebar] = useState<string>('overview');
  const [selectedYear, setSelectedYear] = useState<string>('2025/26 Financial Year');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);

  // Modals
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form states for interactive sub-views
  const [supportType, setSupportType] = useState('Financial Support');
  const [supportAmount, setSupportAmount] = useState('150000');
  const [supportMotivation, setSupportMotivation] = useState('Funding for provincial community arts roadshow workshops');

  const [newMessage, setNewMessage] = useState('');
  const [messagesList, setMessagesList] = useState([
    {
      id: 1,
      sender: 'Thandi Mokoena (DSAC Oversight Reviewer)',
      time: 'Today, 09:15',
      content: 'Good morning Lerato. We have verified your Q1 Portfolio of Evidence. Please ensure the Q2 Youth Arts workshop attendance register includes ID numbers for PFMA Section 38 compliance.',
      isDsac: true,
    },
    {
      id: 2,
      sender: 'Lerato Phiri (Ubuntu Arts Admin)',
      time: 'Today, 10:30',
      content: 'Noted with thanks Ms Mokoena. We have updated the registers and attached the signed verification certificate.',
      isDsac: false,
    },
  ]);

  // Organisation Profile State
  const [orgProfile, setOrgProfile] = useState({
    name: 'Ubuntu Arts NPO',
    npoNumber: 'NPO-2018-8841',
    cipcReg: '2018/142981/08',
    pboNumber: '930064128',
    address: 'Old Fort Complex, 11 Kotze St, Braamfontein, Johannesburg, 2001',
    province: 'Gauteng',
    accountingOfficer: 'Lerato Phiri',
    officerEmail: 'l.phiri@ubuntuarts.org.za',
    officerPhone: '+27 (0)11 384 9200',
    chairperson: 'Dr. Zanele Khumalo',
    treasurer: 'Thabo Maseko (CA SA)',
    bankName: 'Standard Bank South Africa',
    accountEnding: '**** 4921',
  });

  // KPI actuals state for interactive updating
  const [kpiActuals, setKpiActuals] = useState({
    programmes: 12,
    youth: 850,
    practitioners: 95,
    schools: 28,
    exhibitions: 8,
    trainings: 14,
    femaleLed: 68,
    accessibility: 88,
  });

  const currentUser = store.currentUser || {
    name: 'Lerato Phiri',
    role: 'ENTITY_OFFICER',
    designation: 'Organisation Admin',
    email: 'l.phiri@ubuntuarts.org.za',
    entityName: 'Ubuntu Arts NPO',
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: Building },
    { id: 'organisation', label: 'My Organisation', icon: Building },
    { id: 'compliance', label: 'Compliance', icon: ShieldCheck },
    { id: 'kpis', label: 'Targets & KPIs', icon: Target },
    { id: 'budget', label: 'Budget & Utilization', icon: Coins },
    { id: 'support', label: 'Support Requests', icon: HandCoins },
    { id: 'submissions', label: 'Reports Submission', icon: FileText },
    { id: 'documents', label: 'Documents', icon: FolderLock },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'calendar', label: 'Calendar', icon: Calendar, badge: 2 },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
  ];

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActionSuccess('Support Request submitted successfully to DSAC Oversight Directorate.');
    setTimeout(() => {
      setActionSuccess(null);
      setActiveModal(null);
    }, 1500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setMessagesList([
      ...messagesList,
      {
        id: Date.now(),
        sender: `${currentUser.name} (${currentUser.designation})`,
        time: 'Just now',
        content: newMessage.trim(),
        isDsac: false,
      },
    ]);
    setNewMessage('');
  };

  return (
    <div className="flex flex-row min-h-screen w-full bg-slate-100">
      
      {/* 1. Ubuntu Arts Deep Purple Sidebar (Always positioned on left of content) */}
      <aside className="w-48 sm:w-56 shrink-0 bg-[#1e1b4b] text-indigo-100 flex flex-col justify-between select-none border-r border-indigo-950 min-h-screen sticky top-0 self-start z-30">
        <div>
          {/* Top Logo & Title */}
          <div className="p-4 border-b border-indigo-900/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-900/80 border border-indigo-500/30 flex items-center justify-center p-1.5 shadow-inner shrink-0">
              <UbuntuArtsLogo size={28} />
            </div>
            <div>
              <div className="font-black text-white text-xs tracking-wider">Ubuntu Arts NPO</div>
              <div className="text-[10px] text-indigo-300/80 font-medium">Inspiring Communities</div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-2 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSidebar === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSidebar(item.id);
                    if (onNavigateToSection && item.id !== 'overview') {
                      onNavigateToSection(item.id);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#312e81] text-white shadow-sm font-bold ring-1 ring-indigo-400/40'
                      : 'text-indigo-200/80 hover:bg-indigo-900/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-300' : 'text-indigo-300/80'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 bg-amber-400 text-indigo-950 font-bold text-[9px] rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Slogan & Rainbow Bar (Matches image.png) */}
        <div className="p-4 pt-4 border-t border-indigo-900/60 relative overflow-hidden">
          <div className="space-y-0.5 text-[11px] font-semibold tracking-wider text-indigo-300 uppercase mb-3">
            <div className="text-white font-bold text-xs">Create</div>
            <div>Preserve</div>
            <div>Empower</div>
            <div className="text-amber-300 font-bold">Thrive</div>
          </div>
          {/* Rainbow South African decorative gradient strip */}
          <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 via-emerald-500 to-blue-500 shadow-sm" />
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center p-1 shrink-0">
              <UbuntuArtsLogo size={24} />
            </div>
            <div className="truncate">
              <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate">
                Ubuntu Arts NPO
              </h2>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                Inspiring Communities Through Creative Arts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Action: Upload PoE */}
            <button
              onClick={() => setActiveModal('uploadPoE')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload PoE</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  2
                </span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 text-xs">
                  <div className="font-bold text-slate-800 mb-2 pb-1 border-b border-slate-100">
                    Portal Alerts
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-amber-900">
                      <span className="font-bold">Quarter 2 Report Due:</span> 15 Oct 2025 (in 18 days).
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900">
                      <span className="font-bold">Tranche 2 Released:</span> R 1 700 000 disbursed.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile & Sign Out */}
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-indigo-900 text-amber-300 font-bold text-xs flex items-center justify-center border border-indigo-700/50 shadow-xs shrink-0">
                {store.currentUser?.name
                  ? store.currentUser.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                  : 'LP'}
              </div>
              <div className="hidden md:block text-left text-xs">
                <div className="font-bold text-slate-800 leading-none">
                  {store.currentUser?.name || 'Lerato Phiri'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {store.currentUser?.designation || 'Organisation Admin'}
                </div>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg transition-all shadow-xs cursor-pointer ml-1"
                  title="Sign Out of Entity Portal"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Action success alert */}
        {actionSuccess && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* 3. Sub-View Router */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">

          {/* ================= VIEW 1: OVERVIEW (Exact match to image.png) ================= */}
          {activeSidebar === 'overview' && (
            <div className="space-y-5">
              
              {/* Welcome Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    Welcome back, Lerato
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Here's your current status and what needs your attention.
                  </p>
                </div>
                <div>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-hidden"
                  >
                    <option>2025/26 Financial Year</option>
                    <option>2024/25 Financial Year</option>
                    <option>2023/24 Financial Year</option>
                  </select>
                </div>
              </div>

              {/* 5 Quick Status Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                <div 
                  onClick={() => setActiveSidebar('compliance')}
                  className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-emerald-300 transition-all"
                >
                  <div className="text-xs font-medium text-slate-500 mb-2">Compliance Status</div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div className="text-base font-bold text-emerald-600">On Track</div>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveSidebar('calendar')}
                  className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-blue-300 transition-all"
                >
                  <div className="text-xs font-medium text-slate-500 mb-2">Upcoming Due Dates</div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xl font-black text-slate-900 leading-none">2</div>
                      <div className="text-[10px] text-slate-500 font-medium">Next 30 days</div>
                    </div>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveSidebar('submissions')}
                  className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-rose-300 transition-all"
                >
                  <div className="text-xs font-medium text-slate-500 mb-2">Overdue Items</div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xl font-black text-slate-900 leading-none">1</div>
                      <div className="text-[10px] text-slate-500 font-medium">Requires attention</div>
                    </div>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveSidebar('kpis')}
                  className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-teal-300 transition-all"
                >
                  <div className="text-xs font-medium text-slate-500 mb-2">KPIs Achieved</div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xl font-black text-slate-900 leading-none">6/8</div>
                      <div className="text-[10px] text-teal-700 font-bold">75%</div>
                    </div>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveSidebar('budget')}
                  className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1 cursor-pointer hover:border-amber-300 transition-all"
                >
                  <div className="text-xs font-medium text-slate-500 mb-2">Budget Utilized</div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xl font-black text-slate-900 leading-none">64%</div>
                      <div className="text-[10px] text-slate-500 font-medium">R 3.2M of R 5.0M</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Targets (Left) & Upcoming Due Dates (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* My Key Targets (2025/26) */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Target className="w-4 h-4 text-indigo-600" />
                      <span>My Key Targets (2025/26)</span>
                    </h4>
                    <button
                      onClick={() => setActiveSidebar('kpis')}
                      className="text-xs text-indigo-700 font-semibold hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>

                  <div className="py-3 space-y-3.5">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-700">Community arts programmes</span>
                        <span className="font-bold text-slate-900">12 / 15 (80%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-700">Youth participants</span>
                        <span className="font-bold text-slate-900">850 / 1 000 (85%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-700">Workshops conducted</span>
                        <span className="font-bold text-slate-900">18 / 20 (90%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-700">Partnerships established</span>
                        <span className="font-bold text-slate-900">3 / 5 (60%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-amber-400 h-2 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upcoming Due Dates */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>Upcoming Due Dates</span>
                    </h4>
                    <button
                      onClick={() => setActiveSidebar('calendar')}
                      className="text-xs text-indigo-700 font-semibold hover:underline cursor-pointer"
                    >
                      View Calendar
                    </button>
                  </div>

                  <div className="py-2 space-y-3 text-xs">
                    <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-2.5">
                        <FileText className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-800">Quarter 2 Report</div>
                          <div className="text-[11px] text-slate-400">15 Aug 2025</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        5 days left
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-2.5">
                        <FileText className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-800">Budget Utilization Report</div>
                          <div className="text-[11px] text-slate-400">31 Aug 2025</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        21 days left
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-2.5">
                        <FileText className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-800">Strategic Plan Update</div>
                          <div className="text-[11px] text-slate-400">30 Sep 2025</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        51 days left
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-2.5">
                        <FileText className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-800">Annual Report</div>
                          <div className="text-[11px] text-slate-400">31 Mar 2026</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        On track
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Budget Overview (Left) & Support Requests (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Budget Overview */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-600" />
                      <span>Budget Overview</span>
                    </h4>
                    <button
                      onClick={() => setActiveSidebar('budget')}
                      className="text-xs text-indigo-700 font-semibold hover:underline cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>

                  <div className="py-3 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-slate-900 text-sm">R 3.2M of R 5.0M utilized</span>
                      <span className="font-bold text-emerald-700 text-xs">64%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: '64%' }}></div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-center">
                        <div className="text-sm font-black text-slate-900">R 5.0M</div>
                        <div className="text-[10px] text-slate-500 font-medium">Approved</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 text-center">
                        <div className="text-sm font-black text-emerald-800">R 3.2M</div>
                        <div className="text-[10px] text-emerald-700 font-medium">Utilized</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 text-center">
                        <div className="text-sm font-black text-blue-800">R 1.8M</div>
                        <div className="text-[10px] text-blue-700 font-medium">Remaining</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Support Requests */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <HandCoins className="w-4 h-4 text-emerald-600" />
                      <span>Support Requests</span>
                    </h4>
                    <button
                      onClick={() => setActiveModal('support')}
                      className="px-2.5 py-1 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Request</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2.5 py-3 text-center">
                    <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 mx-auto flex items-center justify-center mb-1">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-lg font-black text-slate-900">3</div>
                      <div className="text-[11px] text-slate-600 font-medium">Submitted</div>
                    </div>
                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                      <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center mb-1">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-lg font-black text-amber-900">1</div>
                      <div className="text-[11px] text-amber-800 font-medium">Under Review</div>
                    </div>
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-lg font-black text-emerald-900">1</div>
                      <div className="text-[11px] text-emerald-800 font-medium">Approved</div>
                    </div>
                    <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100">
                      <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 mx-auto flex items-center justify-center mb-1">
                        <XCircle className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-lg font-black text-rose-900">0</div>
                      <div className="text-[11px] text-rose-700 font-medium">Rejected</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 4: Recent Messages (Left) & Quick Actions (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Recent Messages */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-indigo-600" />
                      <span>Recent Messages</span>
                    </h4>
                    <button
                      onClick={() => setActiveSidebar('messages')}
                      className="text-xs text-indigo-700 font-semibold hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>

                  <div className="py-2 space-y-3 text-xs">
                    <div 
                      onClick={() => setActiveSidebar('messages')}
                      className="flex items-start gap-3 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 hover:text-indigo-700 truncate">Feedback on Q1 Report</div>
                        <div className="text-[11px] text-slate-400">DSAC Reviewer · 2 days ago</div>
                      </div>
                    </div>

                    <div 
                      onClick={() => setActiveSidebar('messages')}
                      className="flex items-start gap-3 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 hover:text-indigo-700 truncate">Budget request under review</div>
                        <div className="text-[11px] text-slate-400">DSAC Finance · 4 days ago</div>
                      </div>
                    </div>

                    <div 
                      onClick={() => setActiveSidebar('messages')}
                      className="flex items-start gap-3 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 hover:text-indigo-700 truncate">Reminder: Q2 Report due soon</div>
                        <div className="text-[11px] text-slate-400">DSAC Compliance · 5 days ago</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions (2x2 Grid) */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="pb-3 border-b border-slate-100">
                    <h4 className="font-bold text-sm text-slate-900">Quick Actions</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-2">
                    <button
                      onClick={() => setActiveModal('report')}
                      className="p-3 bg-blue-50/60 hover:bg-blue-50 border border-blue-100 rounded-xl text-left transition-colors flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs group-hover:text-blue-700">Submit a Report</div>
                        <div className="text-[10px] text-slate-500">Quarterly statutory PoE</div>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveModal('support')}
                      className="p-3 bg-amber-50/60 hover:bg-amber-50 border border-amber-100 rounded-xl text-left transition-colors flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <HandCoins className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs group-hover:text-amber-700">Request Support</div>
                        <div className="text-[10px] text-slate-500">Financial or technical</div>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveSidebar('kpis')}
                      className="p-3 bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-100 rounded-xl text-left transition-colors flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs group-hover:text-emerald-700">Update KPI Data</div>
                        <div className="text-[10px] text-slate-500">Record quarterly figures</div>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveModal('uploadPoE')}
                      className="p-3 bg-indigo-50/60 hover:bg-indigo-50 border border-indigo-100 rounded-xl text-left transition-colors flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                        <UploadCloud className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs group-hover:text-indigo-700">Upload Documents</div>
                        <div className="text-[10px] text-slate-500">Statutory registers</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ================= VIEW 2: MY ORGANISATION ================= */}
          {activeSidebar === 'organisation' && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Building className="w-5 h-5 text-indigo-600" />
                      <span>Institutional Profile &amp; Governance Structure</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Statutory registration under the Non-Profit Organisations Act and PFMA Section 38.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActionSuccess('Institutional profile changes saved successfully.');
                      setTimeout(() => setActionSuccess(null), 1500);
                    }}
                    className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-lg shadow-xs"
                  >
                    Save Updates
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Organisation Name</label>
                    <input
                      type="text"
                      value={orgProfile.name}
                      onChange={(e) => setOrgProfile({ ...orgProfile, name: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">NPO Registration Number</label>
                    <input
                      type="text"
                      value={orgProfile.npoNumber}
                      onChange={(e) => setOrgProfile({ ...orgProfile, npoNumber: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">CIPC Company Number</label>
                    <input
                      type="text"
                      value={orgProfile.cipcReg}
                      onChange={(e) => setOrgProfile({ ...orgProfile, cipcReg: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">SARS PBO Tax Exemption #</label>
                    <input
                      type="text"
                      value={orgProfile.pboNumber}
                      onChange={(e) => setOrgProfile({ ...orgProfile, pboNumber: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Physical Address</label>
                    <input
                      type="text"
                      value={orgProfile.address}
                      onChange={(e) => setOrgProfile({ ...orgProfile, address: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Accounting Officer / Admin</label>
                    <input
                      type="text"
                      value={orgProfile.accountingOfficer}
                      onChange={(e) => setOrgProfile({ ...orgProfile, accountingOfficer: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Institutional Email</label>
                    <input
                      type="email"
                      value={orgProfile.officerEmail}
                      onChange={(e) => setOrgProfile({ ...orgProfile, officerEmail: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Board Chairperson</label>
                    <input
                      type="text"
                      value={orgProfile.chairperson}
                      onChange={(e) => setOrgProfile({ ...orgProfile, chairperson: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Board Treasurer</label>
                    <input
                      type="text"
                      value={orgProfile.treasurer}
                      onChange={(e) => setOrgProfile({ ...orgProfile, treasurer: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 3: COMPLIANCE CHECKLIST ================= */}
          {activeSidebar === 'compliance' && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <span>Statutory Compliance Matrix (PFMA Act 1 of 1999)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      National Treasury statutory compliance checklist for public funds recipients.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs">
                      100% On Track
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 text-xs mt-3">
                  {[
                    {
                      title: 'PFMA Section 38 Compliance Certificate',
                      desc: 'Written assurance of effective, efficient and transparent financial systems',
                      status: 'Verified',
                      date: 'Exp: 31 Mar 2026',
                      color: 'bg-emerald-100 text-emerald-800',
                    },
                    {
                      title: 'SARS Tax Compliance Pin (TCS)',
                      desc: 'Active Good Standing verified via SARS eFiling system',
                      status: 'Active',
                      date: 'Exp: 14 Nov 2025',
                      color: 'bg-emerald-100 text-emerald-800',
                    },
                    {
                      title: 'Annual Audited Financial Statements (AFS)',
                      desc: 'Audited by independent registered auditor (Clean Audit opinion)',
                      status: 'Approved',
                      date: 'Submitted 31 Jul 2025',
                      color: 'bg-emerald-100 text-emerald-800',
                    },
                    {
                      title: 'B-BBEE Sworn Affidavit / Certificate',
                      desc: 'Level 1 Contributor with 100% Black Ownership verification',
                      status: 'Valid',
                      date: 'Exp: 10 Jan 2026',
                      color: 'bg-emerald-100 text-emerald-800',
                    },
                    {
                      title: 'Protection of Personal Information Act (POPIA)',
                      desc: 'Registered Information Officer with the Information Regulator',
                      status: 'Registered',
                      date: 'Active',
                      color: 'bg-indigo-100 text-indigo-800',
                    },
                    {
                      title: 'Quarter 1 Performance Report & PoE',
                      desc: 'Validated and accepted by DSAC Oversight Desk',
                      status: 'Approved',
                      date: '15 Jul 2025',
                      color: 'bg-emerald-100 text-emerald-800',
                    },
                  ].map((item, i) => (
                    <div key={i} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-800">{item.title}</div>
                        <div className="text-[11px] text-slate-500">{item.desc}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${item.color}`}>
                          {item.status}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">{item.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 4: TARGETS & KPIS MANAGER ================= */}
          {activeSidebar === 'kpis' && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Target className="w-5 h-5 text-teal-600" />
                      <span>Targets &amp; Key Performance Indicators (2025/26)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Input quarterly actuals and compute performance achievement rates.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActionSuccess('Quarterly KPI actuals updated and transmitted to DSAC.');
                      setTimeout(() => setActionSuccess(null), 1500);
                    }}
                    className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg shadow-xs"
                  >
                    Save &amp; Submit Actuals
                  </button>
                </div>

                <div className="space-y-4 mt-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900">1. Community arts programmes implemented</span>
                      <span className="text-xs font-bold text-teal-700">Target: 15 programmes</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={kpiActuals.programmes}
                        onChange={(e) => setKpiActuals({ ...kpiActuals, programmes: parseInt(e.target.value) || 0 })}
                        className="w-28 p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                      />
                      <span className="text-slate-500">Achieved to date ({Math.round((kpiActuals.programmes / 15) * 100)}%)</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900">2. Youth participants trained in creative arts</span>
                      <span className="text-xs font-bold text-teal-700">Target: 1 000 participants</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={kpiActuals.youth}
                        onChange={(e) => setKpiActuals({ ...kpiActuals, youth: parseInt(e.target.value) || 0 })}
                        className="w-28 p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                      />
                      <span className="text-slate-500">Achieved to date ({Math.round((kpiActuals.youth / 1000) * 100)}%)</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900">3. Creative sector practitioners supported</span>
                      <span className="text-xs font-bold text-teal-700">Target: 120 practitioners</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={kpiActuals.practitioners}
                        onChange={(e) => setKpiActuals({ ...kpiActuals, practitioners: parseInt(e.target.value) || 0 })}
                        className="w-28 p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                      />
                      <span className="text-slate-500">Achieved to date ({Math.round((kpiActuals.practitioners / 120) * 100)}%)</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900">4. Arts education workshops in community schools</span>
                      <span className="text-xs font-bold text-teal-700">Target: 40 workshops</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={kpiActuals.schools}
                        onChange={(e) => setKpiActuals({ ...kpiActuals, schools: parseInt(e.target.value) || 0 })}
                        className="w-28 p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                      />
                      <span className="text-slate-500">Achieved to date ({Math.round((kpiActuals.schools / 40) * 100)}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 5: BUDGET & FINANCIAL UTILIZATION ================= */}
          {activeSidebar === 'budget' && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Coins className="w-5 h-5 text-amber-600" />
                      <span>Financial Utilization &amp; Tranche Claims</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      National Treasury Vote 37 subvention allocation and tranche disbursements.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActionSuccess('Tranche 3 disbursement claim submitted to DSAC Finance Directorate.');
                      setTimeout(() => setActionSuccess(null), 1500);
                    }}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-xs"
                  >
                    Claim Tranche 3 (R 1.0M)
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-slate-500">Voted Allocation</div>
                    <div className="text-lg font-black text-slate-900 mt-1">R 5 000 000</div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="text-emerald-700">Total Expended</div>
                    <div className="text-lg font-black text-emerald-900 mt-1">R 3 200 000</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="text-blue-700">Committed Orders</div>
                    <div className="text-lg font-black text-blue-900 mt-1">R 950 000</div>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="text-amber-700">Liquid Balance</div>
                    <div className="text-lg font-black text-amber-900 mt-1">R 850 000</div>
                  </div>
                </div>

                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-2">
                  Tranche Disbursement Schedule
                </h4>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">Tranche 1 (Initial Statutory Advance)</div>
                      <div className="text-slate-500">Disbursed on approval of 2025/26 Annual Performance Plan</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-emerald-700">R 1 500 000</div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                        Paid 15 May 2025
                      </span>
                    </div>
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">Tranche 2 (Q1 Performance Verified)</div>
                      <div className="text-slate-500">Disbursed following acceptance of Q1 Performance Report</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-emerald-700">R 1 700 000</div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                        Paid 02 Aug 2025
                      </span>
                    </div>
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">Tranche 3 (Mid-Term Claim Eligible)</div>
                      <div className="text-slate-500">Pending Q2 report submission &amp; expenditure audit</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-amber-700">R 1 000 000</div>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                        Ready to Claim
                      </span>
                    </div>
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">Tranche 4 (Final Reconciliation)</div>
                      <div className="text-slate-500">Scheduled for Q4 following close-out audit</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-slate-600">R 800 000</div>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-medium">
                        Q4 FY2026
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 6: SUPPORT REQUESTS ================= */}
          {activeSidebar === 'support' && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <HandCoins className="w-5 h-5 text-emerald-600" />
                      <span>Institutional Support &amp; Technical Assistance</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Request financial, technical, or governance support directly from the DSAC Oversight team.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveModal('support')}
                    className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create New Request</span>
                  </button>
                </div>

                <div className="space-y-3 mt-4 text-xs">
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900">Provincial Arts Showcase Support</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                          Under Review
                        </span>
                      </div>
                      <div className="text-slate-600 mt-1">
                        Financial grant request of R 150 000 for rural community outreach workshops in Limpopo &amp; Mpumalanga.
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">Submitted: 10 Sep 2025 • Reference: REQ-2025-084</div>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900">M&amp;E Technical Advisory &amp; PoE Verification</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Approved &amp; Scheduled
                        </span>
                      </div>
                      <div className="text-slate-600 mt-1">
                        Technical support from DSAC M&amp;E specialist to audit attendance registers and compliance tools.
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">Approved by: Thandi Mokoena • Date: 28 Aug 2025</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 7: REPORTS SUBMISSION ================= */}
          {activeSidebar === 'submissions' && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      <span>Quarterly Statutory Reporting Wizard</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Submit verified performance reports with mandatory Portfolio of Evidence (PoE).
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveModal('report')}
                    className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Submit Q2 Report</span>
                  </button>
                </div>

                <div className="space-y-3 mt-4 text-xs">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">Quarter 2 (Jul - Sep 2025) Performance Report</span>
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">
                        Pending Submission (Due 15 Oct 2025)
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1">
                      Includes programmatic performance actuals for 15 community workshops, 850 youth participants, and financial reconciliation of R 1 200 000 spent.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => setActiveModal('report')}
                        className="px-3 py-1 bg-indigo-700 text-white font-bold rounded-lg text-xs"
                      >
                        Open Submission Form
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">Quarter 1 (Apr - Jun 2025) Performance Report</span>
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                        Approved by DSAC
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1">
                      Report submitted on 14 Jul 2025. Reviewed and cleared by Thandi Mokoena on 18 Jul 2025.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 8: DOCUMENTS & POE ================= */}
          {activeSidebar === 'documents' && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <FolderLock className="w-5 h-5 text-indigo-600" />
                      <span>Portfolio of Evidence &amp; Governance Repository</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Statutory evidence documents uploaded under Section 38 audit verification.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveModal('uploadPoE')}
                    className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Document</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100 text-xs mt-3">
                  {[
                    { name: 'Ubuntu_Arts_Q1_Verified_PoE_Register.pdf', size: '4.2 MB', date: '14 Jul 2025', cat: 'Quarterly PoE' },
                    { name: 'Signed_Board_Resolution_2025_26_Budget.pdf', size: '1.8 MB', date: '02 May 2025', cat: 'Governance' },
                    { name: 'SARS_Tax_Compliance_Status_Pin_Cert.pdf', size: '650 KB', date: '12 Jan 2025', cat: 'Tax Clearance' },
                    { name: 'Independent_Audit_Report_AFS_2024_25.pdf', size: '8.9 MB', date: '31 Jul 2025', cat: 'Financial Statements' },
                    { name: 'Standard_Bank_Entity_Account_Confirmation.pdf', size: '420 KB', date: '15 Apr 2025', cat: 'Banking' },
                  ].map((doc, i) => (
                    <div key={i} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div className="truncate">
                          <div className="font-semibold text-slate-900 truncate">{doc.name}</div>
                          <div className="text-[10px] text-slate-400">{doc.cat} • {doc.size}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-slate-400">{doc.date}</span>
                        <button
                          onClick={() => {
                            setActionSuccess(`Downloaded ${doc.name}`);
                            setTimeout(() => setActionSuccess(null), 1500);
                          }}
                          className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 9: MESSAGES ================= */}
          {activeSidebar === 'messages' && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="pb-4 border-b border-slate-100">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                    <span>Official DSAC Oversight Communications Channel</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Direct two-way correspondence between Ubuntu Arts NPO and DSAC Reviewers.
                  </p>
                </div>

                <div className="space-y-3 my-4 max-h-96 overflow-y-auto pr-2">
                  {messagesList.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-xl text-xs ${
                        m.isDsac
                          ? 'bg-indigo-50/70 border border-indigo-200 ml-0 mr-12'
                          : 'bg-emerald-50/70 border border-emerald-200 ml-12 mr-0'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold mb-1">
                        <span className={m.isDsac ? 'text-indigo-950' : 'text-emerald-950'}>
                          {m.sender}
                        </span>
                        <span className="text-[10px] text-slate-400">{m.time}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{m.content}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-slate-100">
                  <input
                    type="text"
                    placeholder="Type official inquiry or response..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ================= VIEW 10: CALENDAR ================= */}
          {activeSidebar === 'calendar' && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="pb-4 border-b border-slate-100">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    <span>Statutory Submission Deadlines Calendar (FY 2025/26)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Critical dates for compliance, reports, and financial bids under Vote 37.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="flex items-center justify-between font-bold text-amber-900">
                      <span>Quarter 2 Performance Report</span>
                      <span>15 Oct 2025</span>
                    </div>
                    <div className="text-amber-800 mt-1">18 days remaining. Upload all Q2 attendance registers and signed PoE.</div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between font-bold text-blue-900">
                      <span>Mid-Year Financial Statement</span>
                      <span>30 Oct 2025</span>
                    </div>
                    <div className="text-blue-800 mt-1">Reconciliation of R 3.2M expenditure and general ledger extract.</div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>2026/27 Strategic Plan Update</span>
                      <span>30 Nov 2025</span>
                    </div>
                    <div className="text-slate-600 mt-1">Statutory MTEF planning window for the upcoming fiscal cycle.</div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>Quarter 3 Performance Report</span>
                      <span>15 Jan 2026</span>
                    </div>
                    <div className="text-slate-600 mt-1">Submissions for October to December activities and holiday arts festival.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 11: HELP & SUPPORT ================= */}
          {activeSidebar === 'help' && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="pb-4 border-b border-slate-100">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-indigo-600" />
                    <span>Statutory Helpdesk &amp; Guidelines Directory</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Standard operating procedures, PFMA guidance, and institutional support.
                  </p>
                </div>

                <div className="space-y-3 mt-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-900 text-sm mb-1">
                      PFMA Act No. 1 of 1999: Section 38 Responsibilities
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Accounting officers and authorized representatives must ensure the institution maintains effective, efficient, and transparent financial management and internal control systems.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-900 text-sm mb-1">
                      DSAC Oversight Directorate Contact Desk
                    </div>
                    <div className="text-slate-600 space-y-1">
                      <div>Director: Sicelo Sakhile Mkhize (sakhilesicelo94@gmail.com)</div>
                      <div>Chief Reviewer: Thandi Mokoena (t.mokoena@dsac.gov.za)</div>
                      <div>Helpline: +27 (0)12 441 3000 • Sechaba House, 202 Madiba St, Pretoria</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer matching image.png */}
        <footer className="mt-auto bg-white border-t border-slate-200 px-6 py-3 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <span className="text-slate-600 font-medium text-center sm:text-left">
            Partnering for a Vibrant, Inclusive and United Cultural and Creative Sector.
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Ubuntu Arts NPO | Last login: 09 Aug 2025 09:42
          </span>
        </footer>
      </div>

      {/* ================= MODALS ================= */}

      {/* Modal 1: Upload PoE Document */}
      {activeModal === 'uploadPoE' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Upload Verified Portfolio of Evidence</span>
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/40 text-center space-y-2">
              <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto" />
              <div className="font-bold text-slate-800">Drag and drop verified PoE files here</div>
              <div className="text-[10px] text-slate-400">PDF attendance registers, signed declarations, photos (Max 50MB)</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setActiveModal(null)} className="px-3 py-1.5 border rounded-lg text-slate-600">
                Cancel
              </button>
              <button 
                onClick={() => {
                  setActionSuccess('Portfolio of Evidence successfully uploaded and linked to Quarter 2 file.');
                  setTimeout(() => {
                    setActionSuccess(null);
                    setActiveModal(null);
                  }, 1200);
                }} 
                className="px-4 py-1.5 bg-indigo-700 text-white rounded-lg font-semibold"
              >
                Upload &amp; Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Submit a Report */}
      {activeModal === 'report' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Submit Statutory Performance Report</span>
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSupportSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Quarterly Cycle</label>
                <select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <option>Quarter 2 (Jul - Sep 2025)</option>
                  <option>Quarter 3 (Oct - Dec 2025)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expenditure Claimed in Quarter (ZAR)</label>
                <input type="number" defaultValue="1200000" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Accounting Officer Declaration</label>
                <textarea
                  rows={2}
                  defaultValue="I hereby affirm that the programmatic targets and expenditure reported reflect verified records in accordance with PFMA Section 38."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setActiveModal(null)} className="px-3 py-1.5 border rounded-lg text-slate-600">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-indigo-700 text-white rounded-lg font-semibold">
                  Sign &amp; Transmit to DSAC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Request Support */}
      {activeModal === 'support' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <HandCoins className="w-4 h-4 text-emerald-600" />
                <span>Submit Institutional Support Request</span>
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSupportSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Support Category</label>
                <select
                  value={supportType}
                  onChange={(e) => setSupportType(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option>Financial Support (Top-up grant)</option>
                  <option>Technical Advisory &amp; M&amp;E Assistance</option>
                  <option>Governance &amp; Audit Compliance Help</option>
                  <option>Equipment &amp; Venue Support</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estimated Value / Amount (ZAR)</label>
                <input
                  type="number"
                  value={supportAmount}
                  onChange={(e) => setSupportAmount(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motivation / Justification</label>
                <textarea
                  rows={3}
                  value={supportMotivation}
                  onChange={(e) => setSupportMotivation(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setActiveModal(null)} className="px-3 py-1.5 border rounded-lg text-slate-600">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-700 text-white rounded-lg font-semibold">
                  Transmit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
