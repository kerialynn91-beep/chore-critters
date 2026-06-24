
type WorkspaceMode = 'live' | 'demo';

let currentMode: WorkspaceMode = (localStorage.getItem('chore_critters_workspace') as WorkspaceMode) || 'live';

export function getWorkspaceMode(): WorkspaceMode {
  return currentMode;
}

export function setWorkspaceMode(mode: WorkspaceMode) {
  currentMode = mode;
  localStorage.setItem('chore_critters_workspace', mode);
}

export function getCollectionName(name: string): string {
  if (currentMode === 'demo') {
    // We want to isolate everything except maybe some shared config if any
    // But for simplicity, let's prefix everything.
    return `demo_${name}`;
  }
  return name;
}
