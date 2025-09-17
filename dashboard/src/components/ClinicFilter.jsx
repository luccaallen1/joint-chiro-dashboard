import { useState, useEffect } from 'react';
import { Search, ChevronDown, Filter, Star, AlertTriangle } from 'lucide-react';

const ClinicFilter = ({
  clinics = [],
  selectedClinics,
  onClinicsChange,
  compareMode,
  onCompareModeChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filteredClinics, setFilteredClinics] = useState(clinics);

  useEffect(() => {
    const filtered = clinics.filter(clinic =>
      clinic.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClinics(filtered);
  }, [searchTerm, clinics]);

  const handleClinicToggle = (clinic) => {
    const isSelected = selectedClinics.some(c => c.id === clinic.id);

    if (isSelected) {
      onClinicsChange(selectedClinics.filter(c => c.id !== clinic.id));
    } else {
      if (selectedClinics.length < 4) {
        onClinicsChange([...selectedClinics, clinic]);
      }
    }
  };

  const handleQuickFilter = (type) => {
    let filtered = [];

    switch (type) {
      case 'top':
        // Top performers based on conversion rate
        filtered = clinics
          .sort((a, b) => (b.conversionRate || 0) - (a.conversionRate || 0))
          .slice(0, 4);
        break;
      case 'attention':
        // Clinics that need attention (low engagement or conversion)
        filtered = clinics
          .filter(c => (c.conversionRate || 0) < 10 || (c.engagementRate || 0) < 30)
          .slice(0, 4);
        break;
      default:
        filtered = [];
    }

    onClinicsChange(filtered);
    setIsDropdownOpen(false);
  };

  const clearSelection = () => {
    onClinicsChange([]);
  };

  return (
    <div className="bg-white rounded-lg shadow-card p-6 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search clinics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Multi-select Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Filter className="h-4 w-4 mr-2" />
              Select Clinics ({selectedClinics.length}/4)
              <ChevronDown className="h-4 w-4 ml-2" />
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                <div className="py-2 max-h-60 overflow-y-auto">
                  {filteredClinics.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-gray-500">No clinics found</div>
                  ) : (
                    filteredClinics.map((clinic) => {
                      const isSelected = selectedClinics.some(c => c.id === clinic.id);
                      const isDisabled = !isSelected && selectedClinics.length >= 4;

                      return (
                        <button
                          key={clinic.id}
                          onClick={() => !isDisabled && handleClinicToggle(clinic)}
                          disabled={isDisabled}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between ${
                            isSelected ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                          } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span className="truncate">{clinic.name}</span>
                          {isSelected && (
                            <div className="w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Filters and Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          {/* Quick Filters */}
          <div className="flex space-x-2">
            <button
              onClick={() => handleQuickFilter('top')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <Star className="h-3 w-3 mr-1" />
              Top Performers
            </button>
            <button
              onClick={() => handleQuickFilter('attention')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Need Attention
            </button>
          </div>

          {/* Compare Mode Toggle */}
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={compareMode}
                onChange={(e) => onCompareModeChange(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Compare Mode</span>
            </label>
          </div>

          {/* Clear Button */}
          {selectedClinics.length > 0 && (
            <button
              onClick={clearSelection}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Selected Clinics Display */}
      {selectedClinics.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {selectedClinics.map((clinic) => (
              <span
                key={clinic.id}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
              >
                {clinic.name}
                <button
                  onClick={() => handleClinicToggle(clinic)}
                  className="ml-2 hover:text-primary-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicFilter;