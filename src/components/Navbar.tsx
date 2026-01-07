import { Button } from "@/components/ui/button";
import { Package, FileText, BarChart3, Settings } from "lucide-react";

export const Navbar = () => {
  return (
    <nav className="border-b border-border bg-card sticky top-0 z-50 backdrop-blur-sm bg-card/95">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl text-foreground">SCM Pro</span>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <Button variant="ghost" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </Button>
            <Button variant="ghost" className="gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </Button>
            <Button variant="ghost" className="gap-2">
              <Package className="h-4 w-4" />
              Inventory
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          <Button>Get Started</Button>
        </div>
      </div>
    </nav>
  );
};
