import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AppProvider } from "./context/AppContext";
import { AuthProvider } from "./components/Auth/AuthProvider";
import Layout from "./components/Layout/Layout";
import Home from "./pages/Home";
import Blogs from "./pages/Blogs";
import BlogDetail from "./pages/BlogDetail";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MyBlogs from "./pages/MyBlogs";
import MyCourses from "./pages/MyCourses";
import AdminPanel from "./pages/AdminPanel";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import Projects from './pages/Projects';
import MyProjects from './pages/MyProjects';
import NotFound from './pages/NotFound';
import { useEffect } from 'react';
import { getSupabaseConnection } from './lib/supabaseConnection';
import GoogleAnalytics from './components/Analytics/GoogleAnalytics';
import Gallery from './pages/Gallery';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Partnership from './pages/Partnership';

function useSupabasePing() {
  useEffect(() => {
    const connection = getSupabaseConnection();
    const interval = setInterval(() => {
      connection.getHealthStatus?.();
    }, 2 * 60 * 1000); // every 2 minutes
    return () => clearInterval(interval);
  }, []);
}

function ScrollToTopOnRouteChange() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [location.pathname]);
  return null;
}

function App() {
  useSupabasePing();
  return (
    <HelmetProvider>
      <GoogleAnalytics />
      <Router>
        <ScrollToTopOnRouteChange />
        <AuthProvider>
          <AppProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="blogs" element={<Blogs />} />
                <Route path="blog/:slug" element={<BlogDetail />} />
                <Route path="courses" element={<Courses />} />
                <Route path="course/:id" element={<CourseDetail />} />
                <Route path="about" element={<About />} />
                <Route path="contact" element={<Contact />} />
                <Route path="gallery" element={<Gallery />} />
                <Route path="events" element={<Events />} />
                <Route path="events/:id" element={<EventDetail />} />
                <Route path="partnership" element={<Partnership />} />
                <Route path="my-blogs" element={<MyBlogs />} />
                <Route path="my-courses" element={<MyCourses />} />
                <Route path="my-projects" element={<MyProjects />} />
                <Route path="admin" element={<AdminPanel />} />
                <Route path="privacy" element={<Privacy />} />
                <Route path="terms" element={<Terms />} />
                <Route path="cookies" element={<Cookies />} />
                <Route path="projects" element={<Projects />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </AppProvider>
        </AuthProvider>
      </Router>
    </HelmetProvider>
  );
}

export default App;