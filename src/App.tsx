import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import {
  About,
  Contact,
  Feedbacks,
  Hero,
  Navbar,
  Works,
  OpeningSoon,
  CafeGallery,
  StarsCanvas,
  RoadmapPage,
} from "./components";
import BookingPage from "./components/sections/BookingPage";
import BookingConfirmed from "./components/sections/BookingConfirmed";

import { useEffect } from "react";
import { config } from "./constants/config";

// ─── Scroll To Top on Navigation ──────────────────────────────────────────────
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      } else {
        const timeout = setTimeout(() => {
          const el = document.getElementById(id);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 150);
        return () => clearTimeout(timeout);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
};

const Home = () => {
  return (
    <div className="bg-primary relative z-0">
      <div className="bg-hero-pattern bg-cover bg-center bg-no-repeat">
        <Navbar />
        <Hero />
      </div>
      <CafeGallery />
      <About />
      {/* <Tech /> */}
      <Works />

      {/* <div className="relative z-0">
        <PS5Games />
      </div> */}

      <div id="reviews">
        <Feedbacks />
      </div>

      <div className="relative z-0">
        <Contact />
        <StarsCanvas />
      </div>
    </div>
  );
};

const App = () => {
  useEffect(() => {
    if (document.title !== config.html.title) {
      document.title = config.html.title;
    }
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/roadmap" element={<RoadmapPage />} />
        <Route path="/opening-soon" element={<OpeningSoon />} />
        <Route path="/book" element={<BookingPage />} />
        <Route path="/booking-confirmed" element={<BookingConfirmed />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

