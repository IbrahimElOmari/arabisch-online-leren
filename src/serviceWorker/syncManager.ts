/**
 * Background Sync Manager for PWA
 * Handles offline data synchronization
 */

export interface SyncTask {
  id: string;
  type: 'answer' | 'attendance' | 'message' | 'analytics';
  data: Record<string, any>;
  timestamp: number;
  retryCount: number;
}

const SYNC_QUEUE_KEY = 'pwa_sync_queue';
const MAX_RETRIES = 3;

/**
 * Add task to sync queue
 */
export async function queueSyncTask(
  type: SyncTask['type'],
  data: Record<string, any>
): Promise<void> {
  const task: SyncTask = {
    id: crypto.randomUUID(),
    type,
    data,
    timestamp: Date.now(),
    retryCount: 0
  };

  const queue = await getSyncQueue();
  queue.push(task);
  await saveSyncQueue(queue);

  // Trigger sync if online
  if (navigator.onLine) {
    void processSyncQueue();
  }
}

/**
 * Get current sync queue from IndexedDB/localStorage
 */
export async function getSyncQueue(): Promise<SyncTask[]> {
  try {
    const stored = localStorage.getItem(SYNC_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save sync queue
 */
async function saveSyncQueue(queue: SyncTask[]): Promise<void> {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Process sync queue when online
 */
export async function processSyncQueue(): Promise<void> {
  if (!navigator.onLine) return;

  const queue = await getSyncQueue();
  const failed: SyncTask[] = [];

  for (const task of queue) {
    try {
      await syncTask(task);
    } catch (error) {
      console.error(`Sync failed for task ${task.id}:`, error);
      
      if (task.retryCount < MAX_RETRIES) {
        failed.push({ ...task, retryCount: task.retryCount + 1 });
      }
    }
  }

  await saveSyncQueue(failed);
}

/**
 * Sync individual task
 */
async function syncTask(task: SyncTask): Promise<void> {
  const apiUrl = import.meta.env.VITE_SUPABASE_URL;
  const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  let endpoint: string;
  let method = 'POST';

  switch (task.type) {
    case 'answer':
      endpoint = `${apiUrl}/rest/v1/antwoorden`;
      break;
    case 'attendance':
      endpoint = `${apiUrl}/rest/v1/aanwezigheid`;
      break;
    case 'message':
      endpoint = `${apiUrl}/rest/v1/direct_messages`;
      break;
    case 'analytics':
      endpoint = `${apiUrl}/rest/v1/analytics_events`;
      break;
    default:
      throw new Error(`Unknown sync task type: ${task.type}`);
  }

  const response = await fetch(endpoint, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': apiKey,
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(task.data)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
}

/**
 * Clear sync queue
 */
export async function clearSyncQueue(): Promise<void> {
  localStorage.removeItem(SYNC_QUEUE_KEY);
}

/**
 * Get sync queue status
 */
export async function getSyncStatus(): Promise<{
  pendingTasks: number;
  oldestTask: number | null;
}> {
  const queue = await getSyncQueue();
  return {
    pendingTasks: queue.length,
    oldestTask: queue.length > 0 ? Math.min(...queue.map(t => t.timestamp)) : null
  };
}
