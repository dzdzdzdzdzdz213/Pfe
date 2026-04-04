import { useEffect } from 'react';
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

  useEffect(() => {
    if (!table) return;

    const channelName = `realtime-${table}-${JSON.stringify(options.filter || {})}`;

    const channel = supabase.channel(channelName);
    
    const events = Array.isArray(options.event) 
      ? options.event 
      : [options.event || '*'];

    events.forEach(event => {
      channel.on(
        'postgres_changes',
        {
          event: event,
          schema: 'public',
          table,
          ...(options.filter ? { filter: options.filter } : {}),
        },
        (payload) => {
          // Invalidate all related query keys
          queryKeys.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
          });

          // Call optional callback
          if (options.onReceive) {
            options.onReceive(payload);
          }
        }
      );
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, JSON.stringify(queryKeys), JSON.stringify(options.filter)]);
};
