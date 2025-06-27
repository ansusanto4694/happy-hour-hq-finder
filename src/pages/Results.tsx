
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FilterSection } from '../components/FilterSection';
import { SearchResults } from '../components/SearchResults';
import { ResultsMap } from '../components/ResultsMap';
import { TimeDropdown } from '../components/TimeDropdown';
import { Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Results = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize state from URL parameters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [zipCode, setZipCode] = useState(searchParams.get('zip') || '');
  const [startTime, setStartTime] = useState(searchParams.get('startTime') || '');
  const [endTime, setEndTime] = useState(searchParams.get('endTime') || '');

  // Update state when URL parameters change
  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
    setZipCode(searchParams.get('zip') || '');
    setStartTime(searchParams.get('startTime') || '');
    setEndTime(searchParams.get('endTime') || '');
  }, [searchParams]);

  const handleSearch = () => {
    console.log('Searching for:', searchTerm, 'in zip code:', zipCode, 'start time:', startTime, 'end time:', endTime);
    
    // Update URL parameters
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (zipCode) params.set('zip', zipCode);
    if (startTime) params.set('startTime', startTime);
    if (endTime) params.set('endTime', endTime);
    
    setSearchParams(params);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with company name and search bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-8">
            {/* Logo on the left */}
            <h1 
              className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-orange-500 transition-colors flex-shrink-0"
              onClick={handleGoHome}
            >
              Happy.Hour
            </h1>
            
            {/* Search bar on the right */}
            <div className="flex-1 max-w-4xl">
              <div className="bg-white rounded-2xl shadow-lg p-2 flex flex-col lg:flex-row gap-2 border">
                {/* Search input */}
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search for bars, restaurants, or cuisines..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-12 pr-4 py-4 text-lg border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl"
                  />
                </div>
                
                {/* Divider */}
                <div className="hidden lg:block w-px bg-gray-200 my-2"></div>
                
                {/* Starting time dropdown */}
                <div className="lg:w-40">
                  <TimeDropdown
                    placeholder="Starting at..."
                    value={startTime}
                    onChange={setStartTime}
                  />
                </div>
                
                {/* Divider */}
                <div className="hidden lg:block w-px bg-gray-200 my-2"></div>
                
                {/* Ending time dropdown */}
                <div className="lg:w-40">
                  <TimeDropdown
                    placeholder="Ending at..."
                    value={endTime}
                    onChange={setEndTime}
                  />
                </div>
                
                {/* Divider */}
                <div className="hidden lg:block w-px bg-gray-200 my-2"></div>
                
                {/* Zip code input */}
                <div className="lg:w-48 relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Zip code"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-12 pr-4 py-4 text-lg border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl"
                    maxLength={5}
                  />
                </div>
                
                {/* Search button */}
                <Button
                  onClick={handleSearch}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-[calc(100vh-200px)]">
          {/* Filters sidebar - left */}
          <div className="xl:col-span-3 order-1">
            <FilterSection />
          </div>
          
          {/* Search results - middle */}
          <div className="xl:col-span-6 order-2">
            <SearchResults startTime={startTime} endTime={endTime} zipCode={zipCode} />
          </div>
          
          {/* Map - right */}
          <div className="xl:col-span-3 order-3">
            <ResultsMap />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
