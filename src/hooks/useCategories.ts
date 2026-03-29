
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type CategoryType = 'venue_type' | 'cuisine' | 'dietary' | 'experience' | 'beverage';

export type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  description: string | null;
  category_type: CategoryType;
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

  const getSubCategories = (parentId: string) => {
    return categories?.filter(cat => cat.parent_id === parentId) || [];
  };

  const getCategoriesByType = (type: CategoryType) => {
    return categories?.filter(cat => cat.category_type === type) || [];
  };

  const getParentsByType = (type: CategoryType) => {
    return categories?.filter(cat => cat.parent_id === null && cat.category_type === type) || [];
  };

  /** Returns dimension groups: each group has a label, a parent (if any), and its L2 children */
  const getCategoryDimensions = () => {
    if (!categories) return [];

    const dimensionOrder: { type: CategoryType; label: string }[] = [
      { type: 'venue_type', label: 'Venue Type' },
      { type: 'cuisine', label: 'Cuisine' },
      { type: 'experience', label: 'Experience' },
      { type: 'dietary', label: 'Dietary' },
      { type: 'beverage', label: 'Beverage' },
    ];

    return dimensionOrder.map(dim => {
      const parents = categories.filter(c => c.parent_id === null && c.category_type === dim.type);
      return {
        type: dim.type,
        label: dim.label,
        parents,
        // Flat list of all L2 children in this dimension
        children: parents.flatMap(p => categories.filter(c => c.parent_id === p.id)),
      };
    });
  };

  return {
    categories,
    getParentCategories,
    getSubCategories,
    getCategoriesByType,
    getParentsByType,
    getCategoryDimensions,
    ...rest,
  };
};
