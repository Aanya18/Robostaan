// Centralized site configuration for ROBOSTAAN
// All dynamic links, branding, and site-wide settings are managed here


export const siteConfig = {
  // Basic Site Information
  name: 'ROBOSTAAN',
  tagline: 'An Ageless Adventure',
  fullName: 'ROBOSTAAN - An Ageless Adventure',
  description: 'Empowering the next generation of roboticists with cutting-edge education and hands-on experience. Join thousands of students in mastering robotics, AI, and automation.',
  
  // URLs and Domains
  baseUrl: 'https://robostaan.in',
  domain: 'robostaan.in',
  
  // Contact Information
  contact: {
    email: 'robostaan@gmail.com',
    address: {
      country: 'India',
      city: 'Jaipur',
      state: 'Rajasthan'
    }
  },
  
  // Social Media Links
  social: {
    twitter: 'https://x.com/staan_robo?t=r1z5t-jlBixhmTYj7UdfEw&s=08 ',
    linkedin: 'https://www.linkedin.com/company/robostan/',
    youtube: 'https://youtube.com/@robostaan9855?si=MS874BloFN3bjfR-',
    facebook: 'https://www.facebook.com/share/19PEPCm6AP/',
    instagram: 'https://www.instagram.com/robostaan?igsh=MnBoNmZubnA1aXNr',
    github: 'https://github.com/robostaan'
  },
  
  // Branding Assets
  branding: {
    logo: {
      primary: '../assets/logo.png',
      svg: '/logo.svg',
      favicon: '/favicon.svg',
      appleTouchIcon: '/apple-touch-icon.png',
      favicon32: '/favicon-32x32.png',
      favicon16: '/favicon-16x16.png'
    },
    colors: {
      primary: '#f97316', // Orange
      secondary: '#1f2937', // Gray
      accent: '#3b82f6', // Blue
      success: '#10b981', // Green
      warning: '#f59e0b', // Yellow
      error: '#ef4444' // Red
    },
    theme: {
      primary: '#f97316',
      tileColor: '#f97316'
    }
  },
  
  // Authentication Settings
  auth: {
    // Demo accounts for testing (should be disabled in production)
    demoAccounts: [
      { 
        email: 'admin@robostaan.in', 
        password: 'admin123', 
        role: 'Admin',
        description: 'Full administrative access'
      },
      { 
        email: 'instructor@robostaan.in', 
        password: 'instructor123', 
        role: 'Instructor',
        description: 'Course management access'
      },
      { 
        email: 'student@robostaan.in', 
        password: 'student123', 
        role: 'Student',
        description: 'Standard user access'
      }
    ],
    // Admin key for creating admin accounts (should be changed in production)
    adminKey: 'ROBOSTAAN_ADMIN_2024',
    // Super admin email for special privileges
    superAdminEmail: 'admin@robostaan.in',
    // Password requirements
    passwordRequirements: {
      minLength: 6,
      requireUppercase: false,
      requireLowercase: false,
      requireNumbers: false,
      requireSpecialChars: false
    },
    // Session settings
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    rememberMeDuration: 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
  },
  
  // SEO Defaults
  seo: {
    defaultImage: '/og-image.jpg',
    defaultKeywords: [
      'robotics', 'education', 'courses', 'programming', 'AI', 'artificial intelligence',
      'automation', 'technology', 'STEM', 'engineering', 'machine learning', 'computer vision',
      'IoT', 'drones', 'autonomous vehicles', 'robotics programming', 'arduino', 'raspberry pi'
    ],
    defaultAuthor: 'ROBOSTAAN Team',
    language: 'en',
    locale: 'en_IN',
    timezone: 'Asia/Kolkata'
  },
  
  // Navigation Links
  navigation: {
    main: [
      { name: 'Home', path: '/', external: false },
      { name: 'About', path: '/about', external: false },
      {
        name: 'Learn by Build',
        dropdown: true,
        children: [
          { name: 'Blogs', path: '/blogs', external: false },
          { name: 'Courses', path: '/courses', external: false },
          { name: 'Projects', path: '/projects', external: false }
        ]
      },
      {
        name: 'Community',
        dropdown: true,
        children: [
          { name: 'Gallery', path: '/gallery', external: false },
          { name: 'Events', path: '/events', external: false },
          { name: 'Partnership', path: '/partnership', external: false }
        ]
      },
      { name: 'Contact', path: '/contact', external: false }
    ],
    footer: [
      { name: 'Privacy Policy', path: '/privacy', external: false },
      { name: 'Terms of Service', path: '/terms', external: false },
      { name: 'Cookie Policy', path: '/cookies', external: false },
      { name: 'Projects', path: '/projects', external: false },
      { name: 'Support', path: '/contact', external: false }
    ],
    admin: [
      { name: 'Admin Panel', path: '/admin', external: false },
      { name: 'My Blogs', path: '/my-blogs', external: false },
      { name: 'My Courses', path: '/my-courses', external: false }
    ]
  },
  
  // API Endpoints
  api: {
    baseUrl: 'https://robostaan.in/api',
    endpoints: {
      blogs: '/blogs',
      courses: '/courses',
      users: '/users',
      auth: '/auth'
    }
  },
  
  // External Services
  services: {
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL || '',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
    },
    analytics: {
      googleAnalytics: import.meta.env.VITE_GA_ID || '',
      googleTagManager: import.meta.env.VITE_GTM_ID || ''
    },
    emailjs: {
      serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || '',
      templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '',
      publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || ''
    }
  },
  
  // Content Settings
  content: {
    blog: {
      postsPerPage: 12,
      featuredCount: 3,
      excerptLength: 160,
      maxTags: 5
    },
    course: {
      coursesPerPage: 9,
      featuredCount: 3,
      categories: ['Beginner', 'Intermediate', 'Advanced']
    }
  },
  
  // Feature Flags
  features: {
    blogComments: true,
    courseEnrollment: true,
    userProfiles: true,
    adminPanel: true,
    newsletter: true,
    socialSharing: true,
    demoAccounts: true // Enable/disable demo accounts
  },

  // Project Pagination
  projectBatchSize: 10,
  
  // Legal Information
  legal: {
    companyName: 'ROBOSTAAN Technologies Pvt. Ltd.',
    founded: '2024',
    registration: 'U72900MH2024PTC123456',
    gstin: '27AABCR1234Z1Z5'
  }
};

// Helper functions for generating URLs
export const urlHelpers = {
  // Generate full URL for a path
  fullUrl: (path: string): string => {
    return `${siteConfig.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  },
  
  // Generate blog URL
  blogUrl: (slug: string): string => {
    return `${siteConfig.baseUrl}/blog/${slug}`;
  },
  
  // Generate course URL
  courseUrl: (courseId: string): string => {
    return `${siteConfig.baseUrl}/course/${courseId}`;
  },
  
  // Generate canonical URL
  canonicalUrl: (path: string): string => {
    return urlHelpers.fullUrl(path);
  },
  
  // Generate social sharing URL
  socialUrl: (platform: 'twitter' | 'facebook' | 'linkedin', url: string, text?: string): string => {
    const encodedUrl = encodeURIComponent(url);
    const encodedText = text ? encodeURIComponent(text) : '';
    
    switch (platform) {
      case 'twitter':
        return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
      default:
        return url;
    }
  }
};

// SEO-specific configuration
export const seoConfig = {
  // Default structured data for organization
  organizationStructuredData: {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": siteConfig.name,
    "description": siteConfig.description,
    "url": siteConfig.baseUrl,
    "logo": {
      "@type": "ImageObject",
      "url": urlHelpers.fullUrl(siteConfig.branding.logo.primary)
    },
    "image": urlHelpers.fullUrl(siteConfig.seo.defaultImage),
    "sameAs": [
      siteConfig.social.twitter,
      siteConfig.social.linkedin,
      siteConfig.social.youtube
    ],
    "address": {
      "@type": "PostalAddress",
      "addressCountry": siteConfig.contact.address.country,
      "addressLocality": siteConfig.contact.address.city,
      "addressRegion": siteConfig.contact.address.state
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": siteConfig.contact.email
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Robotics Education",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Course",
            "name": "Robotics Programming",
            "description": "Learn the fundamentals of robotics programming"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Course",
            "name": "AI and Machine Learning",
            "description": "Master artificial intelligence and machine learning for robotics"
          }
        }
      ]
    }
  },
  
  // Default website structured data
  websiteStructuredData: {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": siteConfig.name,
    "description": siteConfig.description,
    "url": siteConfig.baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${siteConfig.baseUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": siteConfig.name,
      "logo": {
        "@type": "ImageObject",
        "url": urlHelpers.fullUrl(siteConfig.branding.logo.primary)
      }
    }
  }
};

export default siteConfig; 