import { Navbar } from '@/components/Navbar';
import {
  HeroSection,
  FeaturesSection,
  EvolutionSection,
  CTASection,
  Footer
} from '@/components/Landing';

export default function Home() {
  return (
    <main className="bg-animated min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <EvolutionSection />
      <CTASection />
      <Footer />
    </main>
  );
}
