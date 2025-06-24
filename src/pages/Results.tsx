
import React, { useState } from 'react';
import { FilterSection } from '../components/FilterSection';
import { SearchResults } from '../components/SearchResults';
import { ResultsMap } from '../components/ResultsMap';
import { TimeDropdown } from '../components/TimeDropdown';
import { Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Results = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleSearch = () => {
    console.log('Searching for:', searchTerm, 'in zip code:', zipCode, 'start time:', startTime, 'end time:', endTime);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with company name and search bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Happy.Hour</h1>
          
          {/* Search bar in header */}
          <div className="w-full max-w-5xl mx-auto">
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

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-[calc(100vh-200px)]">
          {/* Filters sidebar - left */}
          <div className="xl:col-span-3 order-1">
            <FilterSection />
          </div>
          
          {/* Search results - middle */}
          <div className="xl:col-span-6 order-2">
            <SearchResults />
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
