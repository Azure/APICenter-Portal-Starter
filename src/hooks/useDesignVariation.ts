import { useSyncExternalStore } from 'react';

type ScenarioId = string;

const STORAGE_KEY = 'playground_scenario';
const EVENT_NAME = 'playground-scenario-change';

function getScenario(): ScenarioId {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'current';
  } catch {
    return 'current';
  }
}

let cachedScenario = getScenario();

function subscribe(callback: () => void): () => void {
  const handler = () => {
    cachedScenario = getScenario();
    callback();
  };
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener('storage', handler);
  };
}

function getSnapshot(): ScenarioId {
  return cachedScenario;
}

/**
 * Returns the active playground scenario ID.
 * When no playground is active, returns 'current'.
 * Production-safe — zero cost when playground is not running.
 */
export function usePlaygroundScenario(): ScenarioId {
  return useSyncExternalStore(subscribe, getSnapshot);
}

/**
 * Returns true if the active scenario matches any of the provided IDs.
 * Useful for conditionally rendering design variations.
 *
 * @example
 * const showFullPage = useDesignVariation('full-page-detail', 'full-redesign');
 */
export function useDesignVariation(...scenarioIds: ScenarioId[]): boolean {
  const active = usePlaygroundScenario();
  return scenarioIds.includes(active);
}
