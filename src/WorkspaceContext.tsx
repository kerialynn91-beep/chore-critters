import React, { createContext, useContext, useState, useCallback } from 'react';

type WorkspaceMode = 'live' | 'demo';

interface WorkspaceContextType {
  mode: WorkspaceMode;
  workspaceId: string | null;
  familyName: string | null;
  setWorkspace: (mode: WorkspaceMode, id?: string | null, name?: string | null) => void;
  getCollectionName: (name: string) => string;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<WorkspaceMode>(() => {
    return (localStorage.getItem('chore_critters_workspace') as WorkspaceMode) || 'live';
  });
  const [workspaceId, setWorkspaceId] = useState<string | null>(() => {
    return localStorage.getItem('chore_critters_workspace_id');
  });
  const [familyName, setFamilyName] = useState<string | null>(() => {
    return localStorage.getItem('chore_critters_family_name');
  });

  const setWorkspace = useCallback((newMode: WorkspaceMode, id: string | null = null, name: string | null = null) => {
    setMode(newMode);
    setWorkspaceId(id);
    setFamilyName(name);
    localStorage.setItem('chore_critters_workspace', newMode);
    if (id) {
      localStorage.setItem('chore_critters_workspace_id', id);
    } else {
      localStorage.removeItem('chore_critters_workspace_id');
    }
    if (name) {
      localStorage.setItem('chore_critters_family_name', name);
    } else {
      localStorage.removeItem('chore_critters_family_name');
    }
  }, []);

  const getCollectionName = useCallback((name: string) => {
    if (mode === 'demo') {
      return `demo_${name}`;
    }
    if (workspaceId) {
      return `ws_${workspaceId}_${name}`;
    }
    return name;
  }, [mode, workspaceId]);

  return (
    <WorkspaceContext.Provider value={{ mode, workspaceId, familyName, setWorkspace, getCollectionName }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
