import Navbar from "../layout/Navbar";
import StarsCanvas from "../canvas/Stars";
import Experience from "./Experience";

const RoadmapPage = () => {
  return (
    <div className="bg-primary relative z-0 min-h-screen overflow-hidden">
      <Navbar />
      <div className="pt-28 pb-16">
        <Experience />
      </div>
      <StarsCanvas />
    </div>
  );
};

export default RoadmapPage;
