import { supabase } from '../lib/supabase';
import { useState, useCallback } from 'react';

/**
 * Custom hook to interact with Supabase tables
 */
export const useSupabase = (tableName) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async (options = {}) => {
    setLoading(true);
    let query = supabase.from(tableName).select(options.select || '*');
    
    if (options.eq) {
      Object.entries(options.eq).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    if (options.order) {
      query = query.order(options.order.column, { ascending: options.order.ascending });
    }

    const { data, error: fetchError } = await query;
    setLoading(false);
    
    if (fetchError) {
      setError(fetchError);
      throw fetchError;
    }
    
    return data;
  }, [tableName]);

  const insertItem = async (item) => {
    setLoading(true);
    const { data, error: insertError } = await supabase.from(tableName).insert(item).select().single();
    setLoading(false);
    
    if (insertError) {
      setError(insertError);
      throw insertError;
    }
    return data;
  };

  const updateItem = async (id, updates) => {
    setLoading(true);
    const { data, error: updateError } = await supabase.from(tableName).update(updates).eq('id', id).select().single();
    setLoading(false);

    if (updateError) {
      setError(updateError);
      throw updateError;
    }
    return data;
  };

  const deleteItem = async (id) => {
    setLoading(true);
    const { error: deleteError } = await supabase.from(tableName).delete().eq('id', id);
    setLoading(false);
    
    if (deleteError) {
      setError(deleteError);
      throw deleteError;
    }
    return true;
  };

  return {
    fetchItems,
    insertItem,
    updateItem,
    deleteItem,
    loading,
    error
  };
};
