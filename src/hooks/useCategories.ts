
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Category = {
  id: string; // Changed to string to match UUID
  name: string;
  slug: string;
  parent_id: string | null; // Changed to string to match UUID
  description: string | null;
  created_at: string;
  updated_at: string;
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }

      // Return data as-is since IDs are already UUIDs (strings)
      return data as Category[];
    },
  });
};

export const useCategoriesHierarchy = () => {
  const { data: categories, ...rest } = useCategories();

  const getParentCategories = () => {
    return categories?.filter(cat => cat.parent_id === null) || [];
  };

  const getSubCategories = (parentId: string) => {
    return categories?.filter(cat => cat.parent_id === parentId) || [];
  };

  return {
    categories,
    getParentCategories,
    getSubCategories,
    ...rest,
  };
};
