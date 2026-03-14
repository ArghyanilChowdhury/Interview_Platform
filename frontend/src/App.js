import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster } from "./components/ui/sonner";
import Navbar from "./components/layout/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import RoleSetup from "./pages/RoleSetup";
import ResumeSetup from "./pages/ResumeSetup";
import LiveInterview from "./pages/LiveInterview";
import InterviewReview from "./pages/InterviewReview";
import InterviewHistory from "./pages/InterviewHistory";
import Profile from "./pages/Profile";
import About from "./pages/About";
import Careers from "./pages/Careers";
import Blog from "./pages/Blog";
import Press from "./pages/Press";
import Contact from "./pages/Contact";
import HelpCenter from "./pages/HelpCenter";
import Donate from "./pages/Donate";
import Feedback from "./pages/Feedback";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";

function AppRouter() {
  const location = useLocation();

  // Check URL fragment for session_id synchronously (prevents race conditions)
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  // Pages where navbar should be hidden
  const hideNavbar = ['/', '/login', '/signup'].includes(location.pathname);
  // Live interview page has its own top bar
  const isLiveInterview = location.pathname.includes('/live');
  // Public pages that should show navbar
  const publicPages = ['/about', '/careers', '/blog', '/press', '/contact', '/help', '/donate', '/feedback', '/privacy', '/terms', '/cookies'];
  const isPublicPage = publicPages.includes(location.pathname);

  return (
    <>
      {(!hideNavbar && !isLiveInterview) && <Navbar />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/interview/role" element={<ProtectedRoute><RoleSetup /></ProtectedRoute>} />
        <Route path="/interview/resume" element={<ProtectedRoute><ResumeSetup /></ProtectedRoute>} />
        <Route path="/interview/:interviewId/live" element={<ProtectedRoute><LiveInterview /></ProtectedRoute>} />
        <Route path="/interview/:interviewId/review" element={<ProtectedRoute><InterviewReview /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><InterviewHistory /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/about" element={<About />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/press" element={<Press />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/cookies" element={<Cookies />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
          <Toaster position="bottom-right" richColors />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
