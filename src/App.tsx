import React, { useState, useEffect } from 'react';
import { store } from './services/store';
import { Header } from './components/Header';
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
  // Navigation tab state
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  
  // Selected entity for workspace inspection
  const [selectedEntityId, setSelectedEntityId] = useState<string>(store.entities[0].id);

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
        onSuccess={() => setShowAuthScreen(false)}
        onCancel={store.currentUser ? () => setShowAuthScreen(false) : undefined}
      />
    );
  }

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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Dynamic Views */}
        {(currentTab === 'dashboard' || currentTab === 'executive') && (
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
            onBackToDashboard={() => setCurrentTab('dashboard')}
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
