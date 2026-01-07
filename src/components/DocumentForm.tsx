import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const DocumentForm = () => {
  const { toast } = useToast();
  const [documentType, setDocumentType] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Document Created",
      description: "Your supply chain document has been generated successfully.",
    });
  };

  return (
    <section className="py-20">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Create New Document
            </h2>
            <p className="text-xl text-muted-foreground">
              Fill in the details to generate your supply chain documentation
            </p>
          </div>
          
          <Card className="p-8 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="documentType">Document Type</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger id="documentType">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchase-order">Purchase Order</SelectItem>
                      <SelectItem value="invoice">Invoice</SelectItem>
                      <SelectItem value="shipping">Shipping Document</SelectItem>
                      <SelectItem value="packing-list">Packing List</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="documentNumber">Document Number</Label>
                  <Input 
                    id="documentNumber" 
                    placeholder="PO-2024-001" 
                    className="transition-all duration-200"
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier/Vendor</Label>
                  <Input 
                    id="supplier" 
                    placeholder="Enter supplier name" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input 
                    id="date" 
                    type="date" 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="items">Items/Description</Label>
                <Textarea 
                  id="items" 
                  placeholder="Enter item details, quantities, and specifications"
                  className="min-h-32"
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Total Quantity</Label>
                  <Input 
                    id="quantity" 
                    type="number" 
                    placeholder="0" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount">Total Amount</Label>
                  <Input 
                    id="amount" 
                    type="number" 
                    placeholder="0.00" 
                    step="0.01"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea 
                  id="notes" 
                  placeholder="Any special instructions or notes"
                  className="min-h-24"
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1 gap-2" size="lg">
                  <FileText className="h-5 w-5" />
                  Generate Document
                </Button>
                <Button type="button" variant="outline" className="gap-2" size="lg">
                  <Download className="h-5 w-5" />
                  Download Template
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </section>
  );
};
