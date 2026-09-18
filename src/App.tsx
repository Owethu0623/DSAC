import React, { useState, useEffect } from 'react';
import { store } from './services/store';
import { DsacRepoDashboard } from './components/DsacRepoDashboard';
import { EntityPortalDashboard } from './components/EntityPortalDashboard';
import { EntityWorkspace } from './components/EntityWorkspace';
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

  // Force re-render when reactive store updates
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setTick(t => t + 1);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    store.logout();
    setCurrentTab('dsac-repo');
  };

  // If user is not authenticated: show clean Official Sign In Screen
  if (!store.currentUser) {
    return (
      <OfficialAuthPortal 
        onSuccess={() => {
          if (store.currentUser?.role === 'ENTITY_OFFICER') {
            if (store.currentUser.entityId) {
              setSelectedEntityId(store.currentUser.entityId);
            }
            setCurrentTab('entity-portal');
          } else {
            setCurrentTab('dsac-repo');
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* 1. Entity Review Workspace (Deep-dive into entity reports & PoE) */}
      {currentTab === 'workspace' && (
        <div className="min-h-screen bg-slate-100 flex flex-col p-4 sm:p-6 max-w-7xl mx-auto">
          <EntityWorkspace
            entityId={selectedEntityId}
            onBackToDashboard={() => setCurrentTab(store.currentUser?.role === 'ENTITY_OFFICER' ? 'entity-portal' : 'dsac-repo')}
          />
        </div>
      )}

      {/* 2. Entity / NPO Portal Dashboard (For Entity Officers) */}
      {currentTab === 'entity-portal' && (
        <EntityPortalDashboard
          entityId={selectedEntityId}
          onOpenWorkspace={() => setCurrentTab('workspace')}
          onLogout={handleLogout}
        />
      )}

      {/* 3. DSAC REPO Dashboard (Official Statutory Oversight Portal) */}
      {currentTab !== 'workspace' && currentTab !== 'entity-portal' && (
        <DsacRepoDashboard
          initialSection={
            currentTab === 'entities' ? 'entities' :
            currentTab === 'executive' || currentTab === 'performance' ? 'performance' :
            currentTab === 'kpis' ? 'kpis' :
            currentTab === 'targets' ? 'targets' :
            currentTab === 'compliance' ? 'compliance' :
            currentTab === 'financials' ? 'financials' :
            currentTab === 'reports' ? 'reports' :
            currentTab === 'queries' ? 'queries' :
            currentTab === 'radar' || currentTab === 'early-warning' || currentTab === 'risks' ? 'risks' :
            currentTab === 'documents' ? 'documents' :
            currentTab === 'tasks' || currentTab === 'approvals' ? 'tasks' :
            currentTab === 'notifications' ? 'notifications' :
            currentTab === 'analytics' ? 'analytics' :
            currentTab === 'audit' ? 'audit' :
            currentTab === 'ai' ? 'ai' :
            currentTab === 'settings' ? 'settings' :
            'overview'
          }
          onNavigateToEntity={(entityId) => {
            setSelectedEntityId(entityId);
            setCurrentTab('workspace');
          }}
          onNavigateToEntitiesList={() => setCurrentTab('entities')}
          onOpenReportDetails={() => setCurrentTab('workspace')}
          onLogout={handleLogout}
        />
      )}

    </div>
  );
}
