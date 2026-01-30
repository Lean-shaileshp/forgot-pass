import { CheckCircle, Circle, Truck, Package } from 'lucide-react';

interface TimelineStep {
  status: string;
  label: string;
  icon: React.ReactNode;
  completed: boolean;
  current: boolean;
}

interface ShipmentTimelineProps {
  currentStatus: string;
}

const getTimelineSteps = (currentStatus: string): TimelineStep[] => {
  const steps = [
    {
      status: 'booked',
      label: 'Created',
      icon: <Package className="h-4 w-4" />,
      completed: false,
      current: false,
    },
    {
      status: 'packed',
      label: 'Packed',
      icon: <Package className="h-4 w-4" />,
      completed: false,
      current: false,
    },
    {
      status: 'picked',
      label: 'Picked',
      icon: <Circle className="h-4 w-4" />,
      completed: false,
      current: false,
    },
    {
      status: 'in_transit',
      label: 'In Transit',
      icon: <Truck className="h-4 w-4" />,
      completed: false,
      current: false,
    },
    {
      status: 'delivered',
      label: 'Delivered',
      icon: <CheckCircle className="h-4 w-4" />,
      completed: false,
      current: false,
    },
  ];

  // Map current status to timeline progression
  // For dockets: booked -> packed -> picked -> in_transit -> at_hub/out_for_delivery -> delivered
  const statusMapping: { [key: string]: number } = {
    // Docket statuses
    'booked': 0,        // Created
    'packed': 1,        // Packed
    'picked': 2,        // Picked
    'in_transit': 3,    // In Transit
    'at_hub': 3,        // In Transit
    'out_for_delivery': 3, // In Transit
    'delivered': 4,     // Delivered
    'returned': 4,      // Delivered (final state)
    // Manifest statuses
    'created': 0,       // Created
    'dispatched': 2,    // Picked
    'arrived': 4,       // Delivered
    'closed': 4,        // Delivered
  };

  const currentIndex = statusMapping[currentStatus.toLowerCase()] ?? 0;

  return steps.map((step, index) => ({
    ...step,
    completed: index < currentIndex,
    current: index === currentIndex,
  }));
};

export function ShipmentTimeline({ currentStatus }: ShipmentTimelineProps) {
  const steps = getTimelineSteps(currentStatus);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Shipment Timeline</h3>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={step.status} className="relative flex items-start gap-4">
              {/* Timeline dot */}
              <div
                className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 transition-colors ${
                  step.completed
                    ? 'border-green-500 bg-green-500 text-white'
                    : step.current
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground bg-background text-muted-foreground'
                }`}
              >
                {step.completed ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  step.icon
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-6">
                <div className="flex items-center gap-2">
                  <h4
                    className={`font-medium ${
                      step.completed || step.current
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </h4>
                  {step.current && (
                    <span className="rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {step.completed
                    ? 'Completed'
                    : step.current
                    ? 'In progress'
                    : 'Pending'
                  }
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}