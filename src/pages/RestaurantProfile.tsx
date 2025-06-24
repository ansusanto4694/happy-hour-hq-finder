
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';

const RestaurantProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const handleBackToResults = () => {
    navigate('/results');
  };
  
  const handleGoHome = () => {
    navigate('/');
  };
  
  // Sample restaurant data - this will be replaced with actual data from your database
  const restaurantData = {
    id: id,
    name: "The Golden Tap",
    logo: "/placeholder.svg",
    address: "123 Main St, Downtown",
    phone: "(555) 123-4567",
    businessHours: {
      monday: "11:00 AM - 11:00 PM",
      tuesday: "11:00 AM - 11:00 PM", 
      wednesday: "11:00 AM - 11:00 PM",
      thursday: "11:00 AM - 11:00 PM",
      friday: "11:00 AM - 12:00 AM",
      saturday: "11:00 AM - 12:00 AM",
      sunday: "12:00 PM - 10:00 PM"
    },
    happyHours: {
      monday: "4:00 PM - 7:00 PM",
      tuesday: "4:00 PM - 7:00 PM",
      wednesday: "4:00 PM - 7:00 PM",
      thursday: "4:00 PM - 7:00 PM",
      friday: "3:00 PM - 8:00 PM",
      saturday: "3:00 PM - 8:00 PM",
      sunday: "No Happy Hour"
    }
  };

  const happyHourDeals = `Buy 1 Get 1 Cocktail $15
Old Fashioned
Manhattan
Margarita
Lychee Martini

Beer $6
Sapporo Asahi
Tiger

House Hot/Cold Sake Combo
Fried Spring Roll (2 piece) $13
Truffle Fries $15
Crispy Wings (3 piece) $18

House Wine $7/Glass
Chardonay
Sauvignon Blanc`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={handleBackToResults}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Results</span>
            </Button>
            <h1 
              className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-orange-500 transition-colors"
              onClick={handleGoHome}
            >
              Happy.Hour
            </h1>
          </div>
        </div>
      </div>

      {/* Restaurant Profile Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-white shadow-lg">
          <CardContent className="p-8">
            {/* Restaurant Logo and Name */}
            <div className="flex items-center space-x-6 mb-8">
              <img 
                src={restaurantData.logo} 
                alt={`${restaurantData.name} logo`}
                className="w-24 h-24 rounded-lg object-cover bg-gray-200"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {restaurantData.name}
                </h1>
              </div>
            </div>

            {/* Restaurant Details */}
            <div className="space-y-6">
              {/* Address */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Address</h2>
                <p className="text-gray-700">{restaurantData.address}</p>
              </div>

              {/* Phone Number */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Phone Number</h2>
                <p className="text-gray-700">{restaurantData.phone}</p>
              </div>

              {/* Business Hours */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Business Hours</h2>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monday:</span>
                    <span className="text-gray-700">{restaurantData.businessHours.monday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tuesday:</span>
                    <span className="text-gray-700">{restaurantData.businessHours.tuesday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Wednesday:</span>
                    <span className="text-gray-700">{restaurantData.businessHours.wednesday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thursday:</span>
                    <span className="text-gray-700">{restaurantData.businessHours.thursday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Friday:</span>
                    <span className="text-gray-700">{restaurantData.businessHours.friday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saturday:</span>
                    <span className="text-gray-700">{restaurantData.businessHours.saturday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sunday:</span>
                    <span className="text-gray-700">{restaurantData.businessHours.sunday}</span>
                  </div>
                </div>
              </div>

              {/* Happy Hours */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Happy Hours</h2>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monday:</span>
                    <span className="text-gray-700">{restaurantData.happyHours.monday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tuesday:</span>
                    <span className="text-gray-700">{restaurantData.happyHours.tuesday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Wednesday:</span>
                    <span className="text-gray-700">{restaurantData.happyHours.wednesday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thursday:</span>
                    <span className="text-gray-700">{restaurantData.happyHours.thursday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Friday:</span>
                    <span className="text-gray-700">{restaurantData.happyHours.friday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saturday:</span>
                    <span className="text-gray-700">{restaurantData.happyHours.saturday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sunday:</span>
                    <span className="text-gray-700">{restaurantData.happyHours.sunday}</span>
                  </div>
                </div>
              </div>

              {/* Happy Hour Deals */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Happy Hour Deals</h2>
                <Textarea
                  value={happyHourDeals}
                  readOnly
                  className="min-h-[300px] font-mono text-sm bg-gray-50 border-gray-300"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RestaurantProfile;
