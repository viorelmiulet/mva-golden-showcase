import Header from "@/components/Header"
import Hero from "@/components/Hero"
import About from "@/components/About"
import Services from "@/components/Services"
import Properties from "@/components/Properties"
import ChatAssistant from "@/components/ChatAssistant"
import Footer from "@/components/Footer"

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <About />
        <Services />
        <Properties />
        <ChatAssistant />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
