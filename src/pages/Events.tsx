import React from 'react';
import { Calendar } from 'lucide-react';

const Events: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center py-12 px-4">
    <div className="flex flex-col items-center bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8">
      <Calendar className="w-16 h-16 text-orange-400 mb-4" />
      <h1 className="text-4xl font-bold mb-2">Our Events</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 text-center max-w-2xl mb-6">
        Stay tuned for exciting events, workshops, and community meetups.
      </p>
      <div className="bg-orange-100 dark:bg-orange-900/20 px-6 py-4 rounded-lg shadow text-orange-600 text-xl font-semibold mb-4">
        Coming Soon
      </div>
    </div>
  </div>
);

export default Events; 