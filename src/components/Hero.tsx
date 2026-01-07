import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Package, TrendingUp } from "lucide-react";
import heroImage from "@/assets/hero-supply-chain.jpg";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-background z-0" />
      
      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              Streamline Your Supply Chain
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Document Management for Modern Supply Chains
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed">
              Create, manage, and track all your supply chain documentation in one powerful platform. 
              From purchase orders to shipping documents, streamline your entire workflow.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90">
                Start Creating Documents
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="gap-2">
                View Demo
              </Button>
            </div>
            
            <div className="flex gap-8 pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <FileText className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">1000+</p>
                  <p className="text-sm text-muted-foreground">Documents Created</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Package className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">500+</p>
                  <p className="text-sm text-muted-foreground">Active Shipments</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-3xl blur-3xl" />
            <img 
              src={heroImage} 
              alt="Supply Chain Management Dashboard" 
              className="relative rounded-2xl shadow-2xl w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
