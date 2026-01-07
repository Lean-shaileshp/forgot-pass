import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Truck, ShoppingCart, ClipboardCheck, Plus } from "lucide-react";

const documentTypes = [
  {
    icon: ShoppingCart,
    title: "Purchase Order",
    description: "Create and manage purchase orders for suppliers",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: FileText,
    title: "Invoice",
    description: "Generate professional invoices for transactions",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    icon: Truck,
    title: "Shipping Document",
    description: "Track and document shipment information",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: ClipboardCheck,
    title: "Packing List",
    description: "Detailed lists of packaged items",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
];

export const DocumentTypes = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            All Your Documents in One Place
          </h2>
          <p className="text-xl text-muted-foreground">
            Create, customize, and manage every type of supply chain document you need
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {documentTypes.map((doc, index) => (
            <Card 
              key={index} 
              className="p-6 hover:shadow-lg transition-all duration-300 border-border hover:border-primary/20 group"
            >
              <div className={`${doc.bgColor} p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <doc.icon className={`h-6 w-6 ${doc.color}`} />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {doc.title}
              </h3>
              <p className="text-muted-foreground mb-4">
                {doc.description}
              </p>
              <Button variant="ghost" className="gap-2 p-0 h-auto font-medium text-primary hover:text-primary/80">
                Create Now
                <Plus className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
