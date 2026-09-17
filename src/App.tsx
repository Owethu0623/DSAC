import React, { useState, useEffect } from 'react';
import { store } from './services/store';
import { Header } from './components/Header';
import { DsacRepoDashboard } from './components/DsacRepoDashboard';
import { EntityPortalDashboard } from './components/EntityPortalDashboard';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { EarlyWarningRadar } from './components/EarlyWarningRadar';
import { EntitiesDirectory } from './components/EntitiesDirectory';
import { EntityWorkspace } from './components/EntityWorkspace';
import { DocumentRepositoryView } from './components/DocumentRepositoryView';
import { TaskManagementView } from './components/TaskManagementView';
import { AIPerformanceAnalyst } from './components/AIPerformanceAnalyst';
import { AuditLogView } from './components/AuditLogView';
import { OfficialAuthPortal } from './components/OfficialAuthPortal';

export default function App() {
  // Determine default tab based on logged-in user role
  const initialRole = store.currentUser?.role;
  const defaultTab = initialRole === 'ENTITY_OFFICER' ? 'entity-portal' : 'dsac-repo';

  // Navigation tab state
  const [currentTab, setCurrentTab] = useState<string>(defaultTab);
  
  // Selected entity for workspace inspection
  const [selectedEntityId, setSelectedEntityId] = useState<string>(
    store.currentUser?.entityId || 'ent-ubuntu-arts'
  );

  // Authentication screen / modal state
  const [showAuthScreen, setShowAuthScreen] = useState<boolean>(false);

  // Force re-render when reactive store updates
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setTick(t => t + 1);
    });
    return () => unsubscribe();
  }, []);

  const handleSelectEntity = (entityId: string) => {
    setSelectedEntityId(entityId);
    setCurrentTab('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If user explicitly signed out or requested auth screen
  if (!store.currentUser || showAuthScreen) {
    return (
      <OfficialAuthPortal 
        onSuccess={() => {
          setShowAuthScreen(false);
          if (store.currentUser?.role === 'ENTITY_OFFICER') {
            setCurrentTab('entity-portal');
          } else {
            setCurrentTab('dsac-repo');
          }
        }}
        onCancel={store.currentUser ? () => setShowAuthScreen(false) : undefined}
      />
    );
  }

  const isWideDashboard = currentTab === 'dsac-repo' || currentTab === 'dashboard' || currentTab === 'entity-portal' || currentTab === 'side-by-side';

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Top Government Banner & Primary Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab: string) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuthModal={() => setShowAuthScreen(true)}
      />

      {/* Main Content Area */}
      <main className={`flex-1 w-full mx-auto px-2 sm:px-4 lg:px-6 py-4 ${isWideDashboard ? 'max-w-[1720px]' : 'max-w-7xl'}`}>
        
        {/* 1. DSAC REPO Dashboard (Exact Left Dashboard from design) */}
        {(currentTab === 'dsac-repo' || currentTab === 'dashboard') && (
          <DsacRepoDashboard
            onNavigateToEntity={(entityId) => {
              setSelectedEntityId(entityId);
              setCurrentTab('workspace');
            }}
            onNavigateToEntitiesList={() => setCurrentTab('entities')}
            onOpenReportDetails={() => setCurrentTab('workspace')}
          />
        )}

        {/* 2. Entity / NPO Portal Dashboard (Exact Right Dashboard from design - Ubuntu Arts NPO) */}
        {currentTab === 'entity-portal' && (
          <EntityPortalDashboard
            entityId={selectedEntityId}
            onOpenWorkspace={() => setCurrentTab('workspace')}
            onBackToDsac={() => setCurrentTab('dsac-repo')}
          />
        )}

        {/* 3. Side-by-Side Dual Dashboard (Exact comparison matching screenshot) */}
        {currentTab === 'side-by-side' && (
          <div className="space-y-3">
            <div className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center justify-between text-xs border border-slate-700 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-400">DSAC Statutory Oversight Architecture</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300">Left: DSAC REPO Dashboard • Right: Ubuntu Arts NPO Portal</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentTab('dsac-repo')}
                  className="px-2 py-0.5 rounded bg-emerald-800 hover:bg-emerald-700 text-[11px] font-semibold text-emerald-100"
                >
                  Expand DSAC View
                </button>
                <button
                  onClick={() => setCurrentTab('entity-portal')}
                  className="px-2 py-0.5 rounded bg-indigo-800 hover:bg-indigo-700 text-[11px] font-semibold text-indigo-100"
                >
                  Expand Entity View
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4 items-start">
              <DsacRepoDashboard
                onNavigateToEntity={(entityId) => {
                  setSelectedEntityId(entityId);
                  setCurrentTab('workspace');
                }}
                onNavigateToEntitiesList={() => setCurrentTab('entities')}
                onOpenReportDetails={() => setCurrentTab('workspace')}
              />
              <EntityPortalDashboard
                entityId={selectedEntityId}
                onOpenWorkspace={() => setCurrentTab('workspace')}
                onBackToDsac={() => setCurrentTab('dsac-repo')}
              />
            </div>
          </div>
        )}

        {/* Executive Pulse Detailed Table View */}
        {currentTab === 'executive' && (
          <ExecutiveDashboard
            onNavigateToEntity={handleSelectEntity}
            onNavigateToEarlyWarning={() => setCurrentTab('radar')}
            onNavigateToAI={() => setCurrentTab('ai')}
          />
        )}

        {(currentTab === 'radar' || currentTab === 'early-warning') && (
          <EarlyWarningRadar
            onNavigateToEntity={handleSelectEntity}
            onOpenCreateTaskModal={(entityId) => {
              setSelectedEntityId(entityId);
              setCurrentTab('tasks');
            }}
          />
        )}

        {currentTab === 'entities' && (
          <EntitiesDirectory
            onSelectEntity={handleSelectEntity}
          />
        )}

        {currentTab === 'workspace' && (
          <EntityWorkspace
            entityId={selectedEntityId}
            onBackToDashboard={() => setCurrentTab('dsac-repo')}
          />
        )}

        {currentTab === 'documents' && (
          <DocumentRepositoryView />
        )}

        {currentTab === 'tasks' && (
          <TaskManagementView />
        )}

        {(currentTab === 'ai' || currentTab === 'ai-analyst') && (
          <AIPerformanceAnalyst />
        )}

        {currentTab === 'audit' && (
          <AuditLogView />
        )}

      </main>

      {/* Official Government Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-[10px] text-white">
              ZA
            </div>
            <span className="font-semibold text-slate-300">
              Department of Sport, Arts and Culture (DSAC)
            </span>
            <span className="text-slate-500">• Official Statutory Oversight System</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Public Finance Management Act (PFMA Act 1 of 1999)</span>
            <span>•</span>
            <span>POPIA Protected</span>
            <span>•</span>
            <span>National Treasury Vote 37 Oversight</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
