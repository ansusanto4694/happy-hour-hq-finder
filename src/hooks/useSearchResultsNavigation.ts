
import { useNavigate } from 'react-router-dom';

export const useSearchResultsNavigation = () => {
  const navigate = useNavigate();

  const handleRestaurantClick = (restaurantIdOrSlug: number | string, slug?: string | null) => {
    // If slug is provided as second arg, use it; otherwise check if first arg is already a slug
    const urlIdentifier = slug || (typeof restaurantIdOrSlug === 'string' && !/^\d+$/.test(restaurantIdOrSlug) 
      ? restaurantIdOrSlug 
      : restaurantIdOrSlug.toString());
    navigate(`/restaurant/${urlIdentifier}`);
  };

  return {
    handleRestaurantClick,
  };
};
