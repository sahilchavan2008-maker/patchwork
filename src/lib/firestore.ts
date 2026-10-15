import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { BugAnalysis } from '@/types/bug';

export interface SavedTicket {
  id: string;
  userId: string;
  userEmail?: string;
  title: string;
  summary: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  createdAt: number;
  analysis?: BugAnalysis;
  answers?: Record<string, string>;
  jiraMarkdown: string;
  playwrightScript?: string;
  jestScript?: string;
  tags?: string[];
  aiModel?: string;
}

const LOCAL_STORAGE_KEY_PREFIX = 'patchwork_saved_tickets_';

/**
 * Helper to get local tickets cache
 */
function getLocalTickets(userId: string): SavedTicket[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Helper to update local tickets cache
 */
function setLocalTickets(userId: string, tickets: SavedTicket[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(tickets));
  } catch (err) {
    console.warn('[Firestore Cache] Failed to write to localStorage:', err);
  }
}

/**
 * Saves a generated ticket & test suite to Cloud Firestore
 * (With automated local caching fallback)
 */
export async function saveTicket(
  ticketData: Omit<SavedTicket, 'id' | 'createdAt'>
): Promise<{ id: string; savedToCloud: boolean }> {
  const timestamp = Date.now();
  let cloudId: string | null = null;
  let savedToCloud = false;

  // 1. Try Firestore Cloud Save
  try {
    const colRef = collection(db, 'saved_tickets');
    const docRef = await addDoc(colRef, {
      ...ticketData,
      createdAt: serverTimestamp(),
      clientTimestamp: timestamp,
    });
    cloudId = docRef.id;
    savedToCloud = true;
    console.log('[Firestore] Ticket saved successfully with ID:', cloudId);
  } catch (err) {
    console.warn('[Firestore] Cloud save encountered an issue (using local cache):', err);
  }

  // 2. Persist to Local Storage Cache
  const finalId = cloudId || `local_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;
  const savedItem: SavedTicket = {
    ...ticketData,
    id: finalId,
    createdAt: timestamp,
  };

  const existing = getLocalTickets(ticketData.userId);
  const updated = [savedItem, ...existing.filter((t) => t.id !== finalId)];
  setLocalTickets(ticketData.userId, updated);

  return { id: finalId, savedToCloud };
}

/**
 * Retrieves all saved tickets for a specific user
 */
export async function getUserTickets(userId: string): Promise<SavedTicket[]> {
  const localList = getLocalTickets(userId);

  try {
    const colRef = collection(db, 'saved_tickets');
    // Query by userId
    const q = query(colRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const cloudTickets: SavedTicket[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let createdAt = Date.now();
        if (data.createdAt instanceof Timestamp) {
          createdAt = data.createdAt.toMillis();
        } else if (typeof data.clientTimestamp === 'number') {
          createdAt = data.clientTimestamp;
        }

        cloudTickets.push({
          id: docSnap.id,
          userId: data.userId,
          userEmail: data.userEmail,
          title: data.title || 'Untitled Bug Ticket',
          summary: data.summary || '',
          severity: data.severity || 'high',
          createdAt,
          analysis: data.analysis,
          answers: data.answers || {},
          jiraMarkdown: data.jiraMarkdown || '',
          playwrightScript: data.playwrightScript,
          jestScript: data.jestScript,
          tags: data.tags || [],
          aiModel: data.aiModel,
        });
      });

      // Sort newest first
      cloudTickets.sort((a, b) => b.createdAt - a.createdAt);

      // Merge and update local cache
      const mergedMap = new Map<string, SavedTicket>();
      cloudTickets.forEach((t) => mergedMap.set(t.id, t));
      localList.forEach((t) => {
        if (!mergedMap.has(t.id)) mergedMap.set(t.id, t);
      });

      const merged = Array.from(mergedMap.values()).sort((a, b) => b.createdAt - a.createdAt);
      setLocalTickets(userId, merged);
      return merged;
    }
  } catch (err) {
    console.warn('[Firestore] Failed to query cloud tickets, returning local cache:', err);
  }

  return localList;
}

/**
 * Deletes a ticket by ID from Firestore and local cache
 */
export async function deleteTicket(ticketId: string, userId: string): Promise<void> {
  // Delete from local cache
  const localList = getLocalTickets(userId);
  setLocalTickets(
    userId,
    localList.filter((t) => t.id !== ticketId)
  );

  // If not a purely local ID, delete from Firestore
  if (!ticketId.startsWith('local_')) {
    try {
      const docRef = doc(db, 'saved_tickets', ticketId);
      await deleteDoc(docRef);
      console.log('[Firestore] Deleted document:', ticketId);
    } catch (err) {
      console.warn('[Firestore] Error deleting document from cloud:', err);
    }
  }
}
