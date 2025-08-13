#!/usr/bin/env node

/**
 * Sitemap Update Script
 * 
 * This script updates the sitemap.xml with dynamic content from Supabase.
 * Run this script manually or set up a cron job to keep the sitemap updated.
 * 
 * Usage:
 *   node scripts/updateSitemap.js
 *   npm run update-sitemap
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (support both Vite-style and server-style)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // preferred for server-side scripts
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabaseKey = supabaseServiceKey || supabaseAnonKey;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials. Set one of the following:');
  console.error('- SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (preferred for scripts), or');
  console.error('- SUPABASE_URL and SUPABASE_ANON_KEY, or');
  console.error('- VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.warn('⚠️ Using anon key. If RLS blocks reads, set SUPABASE_SERVICE_ROLE_KEY for this script.');
}

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

/**
 * Generate sitemap XML content
 */
function generateSitemapXML(sitemapData) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Add static pages
  sitemapData.staticPages.forEach(page => {
    xml += '  <url>\n';
    xml += `    <loc>${page.url}</loc>\n`;
    if (page.lastmod) {
      xml += `    <lastmod>${page.lastmod}</lastmod>\n`;
    }
    if (page.changefreq) {
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    }
    if (page.priority) {
      xml += `    <priority>${page.priority}</priority>\n`;
    }
    xml += '  </url>\n';
  });
  
  // Add blog pages
  sitemapData.blogs.forEach(blog => {
    xml += '  <url>\n';
    xml += `    <loc>${blog.url}</loc>\n`;
    if (blog.lastmod) {
      xml += `    <lastmod>${blog.lastmod}</lastmod>\n`;
    }
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';
  });
  
  // Add course pages
  sitemapData.courses.forEach(course => {
    xml += '  <url>\n';
    xml += `    <loc>${course.url}</loc>\n`;
    if (course.lastmod) {
      xml += `    <lastmod>${course.lastmod}</lastmod>\n`;
    }
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += '    <priority>0.7</priority>\n';
    xml += '  </url>\n';
  });
  
  xml += '</urlset>';
  
  return xml;
}

/**
 * Get default sitemap data with static pages
 */
function getDefaultSitemapData() {
  const now = new Date().toISOString().split('T')[0];
  
  return {
    staticPages: [
      {
        url: 'https://robostaan.in/',
        lastmod: now,
        changefreq: 'daily',
        priority: 1.0
      },
      {
        url: 'https://robostaan.in/blogs',
        lastmod: now,
        changefreq: 'daily',
        priority: 0.9
      },
      {
        url: 'https://robostaan.in/courses',
        lastmod: now,
        changefreq: 'weekly',
        priority: 0.9
      },
      {
        url: 'https://robostaan.in/about',
        lastmod: now,
        changefreq: 'monthly',
        priority: 0.6
      },
      {
        url: 'https://robostaan.in/contact',
        lastmod: now,
        changefreq: 'monthly',
        priority: 0.5
      }
    ],
    blogs: [],
    courses: []
  };
}

/**
 * Update sitemap with dynamic content from Supabase
 */
async function updateSitemapWithContent(sitemapData) {
  try {
    console.log('Fetching blogs from Supabase...');
    const { data: blogs, error: blogsError } = await supabase
      .from('blogs')
      .select('slug, updated_at')
      .order('updated_at', { ascending: false });
    
    if (blogsError) {
      console.error('Error fetching blogs:', blogsError);
    } else if (blogs) {
      sitemapData.blogs = blogs.map(blog => ({
        url: `https://robostaan.in/blog/${blog.slug}`,
        lastmod: blog.updated_at ? new Date(blog.updated_at).toISOString().split('T')[0] : undefined,
        changefreq: 'weekly',
        priority: 0.8
      }));
      console.log(`Added ${blogs.length} blogs to sitemap`);
    }
    
    console.log('Fetching courses from Supabase...');
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, updated_at')
      .order('updated_at', { ascending: false });
    
    if (coursesError) {
      console.error('Error fetching courses:', coursesError);
    } else if (courses) {
      sitemapData.courses = courses.map(course => ({
        url: `https://robostaan.in/course/${course.id}`,
        lastmod: course.updated_at ? new Date(course.updated_at).toISOString().split('T')[0] : undefined,
        changefreq: 'monthly',
        priority: 0.7
      }));
      console.log(`Added ${courses.length} courses to sitemap`);
    }
    
    return sitemapData;
  } catch (error) {
    console.error('Error updating sitemap with content:', error);
    return sitemapData;
  }
}

/**
 * Main function to generate and save sitemap
 */
async function generateSitemap() {
  try {
    console.log('Starting sitemap generation...');
    
    // Get sitemap data
    let sitemapData = getDefaultSitemapData();
    sitemapData = await updateSitemapWithContent(sitemapData);
    
    // Generate XML sitemap
    const sitemapXML = generateSitemapXML(sitemapData);
    
    // Save to public directory
    const sitemapPath = path.join(__dirname, '../public/sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemapXML, 'utf8');
    
    console.log('✅ Sitemap generated successfully!');
    console.log(`📁 Location: ${sitemapPath}`);
    console.log(`📊 Total URLs: ${sitemapData.staticPages.length + sitemapData.blogs.length + sitemapData.courses.length}`);
    console.log(`📄 Static pages: ${sitemapData.staticPages.length}`);
    console.log(`📝 Blogs: ${sitemapData.blogs.length}`);
    console.log(`🎓 Courses: ${sitemapData.courses.length}`);
    
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

// Run the script
generateSitemap();