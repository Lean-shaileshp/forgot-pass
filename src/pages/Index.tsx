import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { DocumentTypes } from "@/components/DocumentTypes";
import { DocumentForm } from "@/components/DocumentForm";
import { Features } from "@/components/Features";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Features />
      <DocumentTypes />
      <DocumentForm />
      
      <footer className="border-t border-border py-12 bg-card">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-foreground">SCM Pro</span>
              <span className="text-muted-foreground">© 2024 All rights reserved</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Professional Supply Chain Documentation System
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
