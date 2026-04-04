import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Real-time subscription hook for Supabase tables.
 * Automatically invalidates React Query cache when changes occur.
 * 
 * @param {string} table - The Supabase table name to subscribe to
 * @param {string[]} queryKeys - React Query keys to invalidate on change
 * @param {object} options - Optional filter and event options
 */
export const useRealTime = (table, queryKeys = [], options = {}) => {
  const queryClient = useQueryClient();
  const queryKeysRef = useRef(queryKeys);
  const optionsRef = useRef(options);

  useEffect(() => {
    if (!table) return;

    const currentOptions = optionsRef.current;
    const currentQueryKeys = queryKeysRef.current;
    const filter = currentOptions.filter || {};
    const event = currentOptions.event || '*';
    const onReceive = currentOptions.onReceive;

    const channelName = `realtime-${table}-${JSON.stringify(filter)}`;
    const channel = supabase.channel(channelName);
    
    const events = Array.isArray(event) ? event : [event];

    events.forEach(evt => {
      channel.on(
        'postgres_changes',
        {
          event: evt,
          schema: 'public',
          table,
          ...(filter ? { filter } : {}),
        },
        (payload) => {
          // Invalidate all related query keys
          currentQueryKeys.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
          });

          // Call optional callback
          if (onReceive) {
            onReceive(payload);
          }
        }
      );
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, queryClient]);
};
