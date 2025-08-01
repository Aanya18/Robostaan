// Sample data utility for testing
import { eventService } from '../services/eventService';

export const addSampleEvents = async () => {
  console.log('🌱 Adding sample events...');
  
  const sampleEvents = [
    {
      title: 'Robotics Workshop 2024',
      description: 'Learn the basics of robotics programming and build your first robot.',
      cloudinary_folder: 'robotics-workshop-2024',
      date: '2024-02-15',
      location: 'Tech Hub, Building A',
      image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600',
      tags: ['workshop', 'robotics', 'beginner'],
      is_featured: true
    },
    {
      title: 'AI Competition Finals',
      description: 'Annual AI programming competition showcasing innovative projects.',
      cloudinary_folder: 'ai-competition-finals',
      date: '2024-03-20',
      location: 'Main Auditorium',
      image_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600',
      tags: ['competition', 'ai', 'programming'],
      is_featured: true
    },
    {
      title: 'Arduino Masterclass',
      description: 'Deep dive into Arduino programming and circuit design.',
      cloudinary_folder: 'arduino-masterclass',
      date: '2024-01-10',
      location: 'Lab 101',
      image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=600',
      tags: ['arduino', 'electronics', 'masterclass'],
      is_featured: false
    },
    {
      title: '3D Printing Exhibition',
      description: 'Showcase of 3D printed projects and latest printing technologies.',
      cloudinary_folder: '3d-printing-exhibition',
      date: '2024-04-05',
      location: 'Exhibition Hall',
      image_url: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=800&h=600',
      tags: ['3d-printing', 'exhibition', 'technology'],
      is_featured: false
    },
    {
      title: 'Drone Flying Contest',
      description: 'Exciting drone racing and aerial photography competition.',
      cloudinary_folder: 'drone-flying-contest',
      date: '2024-05-12',
      location: 'Outdoor Field',
      image_url: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&h=600',
      tags: ['drone', 'contest', 'flying'],
      is_featured: true
    }
  ];

  const results = [];
  
  for (const eventData of sampleEvents) {
    try {
      console.log(`📝 Creating event: ${eventData.title}`);
      const result = await eventService.createEvent(eventData);
      
      if (result.success) {
        console.log(`✅ Created: ${eventData.title}`);
        results.push({ success: true, event: eventData.title });
      } else {
        console.error(`❌ Failed to create ${eventData.title}:`, result.error);
        results.push({ success: false, event: eventData.title, error: result.error });
      }
    } catch (error) {
      console.error(`💥 Exception creating ${eventData.title}:`, error);
      results.push({ success: false, event: eventData.title, error: error.message });
    }
  }
  
  console.log('🎯 Sample events creation completed:', results);
  return results;
};

// Helper function to clear all events (for testing)
export const clearAllEvents = async () => {
  console.log('🧹 This function is not implemented for safety. Use Supabase dashboard to clear events manually.');
};

// Export for browser console
(window as any).addSampleEvents = addSampleEvents;
(window as any).clearAllEvents = clearAllEvents;

console.log('🚀 Sample data utilities loaded! Use addSampleEvents() in console to add test data.');