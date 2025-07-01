
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Category = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
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

      return data as Category[];
    },
  });
};

export const useCategoriesHierarchy = () => {
  const { data: categories, ...rest } = useCategories();

  const getParentCategories = () => {
    return categories?.filter(cat => cat.parent_id === null) || [];
  };

  const getSubCategories = (parentId: number) => {
    return categories?.filter(cat => cat.parent_id === parentId) || [];
  };

  return {
    categories,
    getParentCategories,
    getSubCategories,
    ...rest,
  };
};
