import { create } from 'zustand';
import type { FlightSearchParams, HotelSearchParams, CarSearchParams } from '../types';

type SearchTab = 'flights' | 'hotels' | 'cars';

interface SearchState {
  activeTab: SearchTab;
  flightParams: Partial<FlightSearchParams>;
  hotelParams: Partial<HotelSearchParams>;
  carParams: Partial<CarSearchParams>;
  
  setActiveTab: (tab: SearchTab) => void;
  setFlightParams: (params: Partial<FlightSearchParams>) => void;
  setHotelParams: (params: Partial<HotelSearchParams>) => void;
  setCarParams: (params: Partial<CarSearchParams>) => void;
  resetSearch: () => void;
}

const initialFlightParams: Partial<FlightSearchParams> = {
  tripType: 'roundtrip',
  passengers: 1,
  flightClass: 'economy',
};

const initialHotelParams: Partial<HotelSearchParams> = {
  guests: 2,
  rooms: 1,
};

const initialCarParams: Partial<CarSearchParams> = {};

export const useSearchStore = create<SearchState>((set) => ({
  activeTab: 'flights',
  flightParams: initialFlightParams,
  hotelParams: initialHotelParams,
  carParams: initialCarParams,
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  setFlightParams: (params) => set((state) => ({
    flightParams: { ...state.flightParams, ...params },
  })),
  
  setHotelParams: (params) => set((state) => ({
    hotelParams: { ...state.hotelParams, ...params },
  })),
  
  setCarParams: (params) => set((state) => ({
    carParams: { ...state.carParams, ...params },
  })),
  
  resetSearch: () => set({
    flightParams: initialFlightParams,
    hotelParams: initialHotelParams,
    carParams: initialCarParams,
  }),
}));


