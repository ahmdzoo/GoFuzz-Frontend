import { useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import DashboardPreview from "@/components/DashboardPreview";
import FAQSection from "@/components/FAQSection";
import FooterSection from "@/components/FooterSection";
import OwaspEducation from "@/components/OwaspEducation";
import CoreSection from "@/components/CoreSection";

const Index = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <HeroSection/>
      <AboutSection />
      <CoreSection />
      <DashboardPreview />
      <OwaspEducation />
      <FAQSection />
      <FooterSection />
    </div>
  );
};

export default Index;
