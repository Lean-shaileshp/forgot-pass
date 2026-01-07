import { Card } from "@/components/ui/card";
import { Zap, Shield, Globe, Clock } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Fast Generation",
    description: "Create professional documents in seconds with smart templates",
  },
  {
    icon: Shield,
    title: "Secure & Compliant",
    description: "Bank-level security with industry compliance standards",
  },
  {
    icon: Globe,
    title: "Global Support",
    description: "Multi-currency and multi-language documentation support",
  },
  {
    icon: Clock,
    title: "Real-time Tracking",
    description: "Monitor document status and shipments in real-time",
  },
];

export const Features = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Why Choose SCM Pro?
          </h2>
          <p className="text-xl text-muted-foreground">
            Powerful features designed for modern supply chain operations
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="p-6 text-center hover:shadow-lg transition-all duration-300 border-border"
            >
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-4 rounded-2xl w-fit mx-auto mb-4">
                <feature.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
