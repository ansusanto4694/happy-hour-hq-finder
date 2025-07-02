
import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const AssignCategoriesToDaiHachi = () => {
  const { toast } = useToast();

  useEffect(() => {
    const assignCategories = async () => {
      try {
        // First, find Dai Hachi merchant ID
        const { data: merchant, error: merchantError } = await supabase
          .from('Merchant')
          .select('id')
          .ilike('restaurant_name', '%Dai Hachi%')
          .single();

        if (merchantError || !merchant) {
          console.error('Could not find Dai Hachi merchant:', merchantError);
          toast({
            title: "Error",
            description: "Could not find Dai Hachi restaurant",
            variant: "destructive",
          });
          return;
        }

        // Find Restaurant and Japanese categories
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name')
          .in('name', ['Restaurant', 'Japanese']);

        if (categoriesError || !categories) {
          console.error('Could not find categories:', categoriesError);
          toast({
            title: "Error",
            description: "Could not find required categories",
            variant: "destructive",
          });
          return;
        }

        // Check if assignments already exist
        const { data: existingAssignments } = await supabase
          .from('merchant_categories')
          .select('category_id')
          .eq('merchant_id', merchant.id)
          .in('category_id', categories.map(c => c.id));

        const existingCategoryIds = existingAssignments?.map(a => a.category_id) || [];
        const categoriesToAssign = categories.filter(c => !existingCategoryIds.includes(c.id));

        if (categoriesToAssign.length === 0) {
          console.log('Categories are already assigned to Dai Hachi');
          return;
        }

        // Create the assignments
        const assignments = categoriesToAssign.map(category => ({
          merchant_id: merchant.id,
          category_id: category.id
        }));

        const { error: insertError } = await supabase
          .from('merchant_categories')
          .insert(assignments);

        if (insertError) {
          console.error('Error assigning categories:', insertError);
          toast({
            title: "Error",
            description: "Failed to assign categories",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Success",
          description: `Assigned ${categoriesToAssign.map(c => c.name).join(' and ')} categories to Dai Hachi`,
        });

      } catch (error) {
        console.error('Unexpected error:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      }
    };

    assignCategories();
  }, [toast]);

  return null; // This component doesn't render anything visible
};
