
import { useNavigate } from 'react-router-dom';

export const useSearchResultsNavigation = () => {
  const navigate = useNavigate();

  const handleRestaurantClick = (restaurantId: number) => {
    navigate(`/restaurant/${restaurantId}`);
  };

  return {
    handleRestaurantClick,
  };
};
