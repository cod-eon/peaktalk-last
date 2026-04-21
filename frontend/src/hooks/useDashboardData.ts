'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useBilling } from '@/hooks/useBilling';
import type { SessionItem } from '@/lib/constants/personas';

export type UserState = 'loading' | 'new' | 'active';

export type DocumentItem = {
  id: string;
  name: string;
  created_at: string;
};

export type UserProfile = {
  segment?: string;
  primary_goal?: string;
  user_metadata?: {
    display_name?: string;
  };
} | null;

export function useDashboardData() {
  const [profile, setProfile] = useState<UserProfile>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userState, setUserState] = useState<UserState>('loading');
  const [error, setError] = useState<Error | null>(null);

  const billing = useBilling();

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);
        setUserState('loading');
        
        const [meRes, simRes, docRes] = await Promise.allSettled([
          api.get('/me'),
          api.get('/simulation?limit=10'),
          api.get('/documents?limit=10')
        ]);

        if (!isMounted) return;

        let fetchedProfile = null;
        let fetchedSessions: SessionItem[] = [];
        let fetchedDocs: DocumentItem[] = [];
        let hasError = false;

        if (meRes.status === 'fulfilled') {
          fetchedProfile = meRes.value;
        } else {
          hasError = true;
        }
        
        if (simRes.status === 'fulfilled' && simRes.value?.items) {
          fetchedSessions = simRes.value.items;
        } else if (simRes.status === 'rejected') {
          hasError = true;
        }

        if (docRes.status === 'fulfilled' && docRes.value?.items) {
          fetchedDocs = docRes.value.items;
        } else if (docRes.status === 'rejected') {
          hasError = true;
        }

        if (hasError && !fetchedProfile && fetchedSessions.length === 0 && fetchedDocs.length === 0) {
           setError(new Error('Не удалось загрузить данные'));
        }

        setProfile(fetchedProfile);
        setSessions(fetchedSessions);
        setDocuments(fetchedDocs);

        if (fetchedSessions.length === 0 && fetchedDocs.length === 0) {
          setUserState('new');
        } else {
          setUserState('active');
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err : new Error('Ошибка загрузки'));
        setUserState('new'); // Fallback to 'new' empty state
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  return { profile, sessions, documents, billing, userState, isLoading, error };
}
