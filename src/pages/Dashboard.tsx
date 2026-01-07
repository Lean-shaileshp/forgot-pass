import { useEffect, useState } from "react";
import {
  Package,
  Truck,
  Users,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertTriangle,
  ClipboardList,
  Receipt,
  Warehouse,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Customer, Docket, Pickup, Manifest, DeliveryRunSheet, POD, Invoice, Office } from "@/types";
import { initialCustomers, initialDockets, initialPickups, initialManifests, initialOffices, initialInvoices } from "@/data/initialData";
import { formatCurrency } from "@/hooks/useLocalStorage";

interface Activity {
  id: string;
  action: string;
  description: string;
  time: string;
  status: 'success' | 'pending' | 'warning';
}

export default function Dashboard() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dockets, setDockets] = useState<Docket[]>([]);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [manifests, setManifests] = useState<Manifest[]>([]);
  const [deliveryRunSheets, setDeliveryRunSheets] = useState<DeliveryRunSheet[]>([]);
  const [pods, setPods] = useState<POD[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);

  // Load data from localStorage
  useEffect(() => {
    setCustomers(JSON.parse(localStorage.getItem('logistics_customers') || JSON.stringify(initialCustomers)));
    setDockets(JSON.parse(localStorage.getItem('logistics_dockets') || JSON.stringify(initialDockets)));
    setPickups(JSON.parse(localStorage.getItem('logistics_pickups') || JSON.stringify(initialPickups)));
    setManifests(JSON.parse(localStorage.getItem('logistics_manifests') || JSON.stringify(initialManifests)));
    setDeliveryRunSheets(JSON.parse(localStorage.getItem('logistics_delivery_run_sheets') || '[]'));
    setPods(JSON.parse(localStorage.getItem('logistics_pods') || '[]'));
    setInvoices(JSON.parse(localStorage.getItem('logistics_invoices') || JSON.stringify(initialInvoices)));
    setOffices(JSON.parse(localStorage.getItem('logistics_offices') || JSON.stringify(initialOffices)));
  }, []);

  // Calculate KPIs
  const totalDockets = dockets.length;
  const inTransitDockets = dockets.filter(d => d.status === 'in_transit' || d.status === 'out_for_delivery').length;
  const pendingPickups = pickups.filter(p => p.status === 'pending' || p.status === 'assigned').length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const deliveredToday = dockets.filter(d => {
    const today = new Date().toDateString();
    return d.status === 'delivered' && new Date(d.updatedAt).toDateString() === today;
  }).length;
  const pendingInvoices = invoices.filter(i => i.status === 'sent' || i.status === 'partial').length;
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.totalAmount, 0);
  const pendingAmount = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((sum, i) => sum + i.balanceAmount, 0);

  const kpiData = [
    {
      title: "Total Dockets",
      value: totalDockets.toLocaleString(),
      change: "+12.5%",
      trend: "up" as const,
      icon: FileText,
      color: "bg-primary",
    },
    {
      title: "In Transit",
      value: inTransitDockets.toLocaleString(),
      change: "+8.2%",
      trend: "up" as const,
      icon: Truck,
      color: "bg-secondary",
    },
    {
      title: "Pending Pickups",
      value: pendingPickups.toLocaleString(),
      change: pendingPickups > 5 ? "+15%" : "-5%",
      trend: pendingPickups > 5 ? "up" as const : "down" as const,
      icon: Package,
      color: "bg-accent",
    },
    {
      title: "Active Customers",
      value: activeCustomers.toLocaleString(),
      change: "+3.8%",
      trend: "up" as const,
      icon: Users,
      color: "bg-primary",
    },
  ];

  // Generate recent activity from actual data
  const recentActivity: Activity[] = [
    ...dockets.slice(-3).map(d => ({
      id: `docket-${d.id}`,
      action: d.status === 'delivered' ? 'Delivery completed' : 'Docket created',
      description: `${d.docketNumber} for ${d.customerName}`,
      time: getTimeAgo(d.updatedAt),
      status: d.status === 'delivered' ? 'success' as const : 'pending' as const,
    })),
    ...pickups.slice(-2).map(p => ({
      id: `pickup-${p.id}`,
      action: 'Pickup scheduled',
      description: `${p.pickupNumber} from ${p.customerName}`,
      time: getTimeAgo(p.createdAt),
      status: p.status === 'completed' ? 'success' as const : 'pending' as const,
    })),
    ...manifests.slice(-2).map(m => ({
      id: `manifest-${m.id}`,
      action: 'Manifest generated',
      description: `${m.manifestNumber} with ${m.docketCount} dockets`,
      time: getTimeAgo(m.createdAt),
      status: m.status === 'arrived' ? 'success' as const : 'pending' as const,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

  // Docket status distribution for pie chart
  const statusDistribution = [
    { name: 'Booked', value: dockets.filter(d => d.status === 'booked').length, color: 'hsl(var(--primary))' },
    { name: 'In Transit', value: dockets.filter(d => d.status === 'in_transit').length, color: 'hsl(var(--secondary))' },
    { name: 'Out for Delivery', value: dockets.filter(d => d.status === 'out_for_delivery').length, color: 'hsl(var(--accent))' },
    { name: 'Delivered', value: dockets.filter(d => d.status === 'delivered').length, color: 'hsl(142 76% 36%)' },
    { name: 'Returned', value: dockets.filter(d => d.status === 'returned').length, color: 'hsl(var(--destructive))' },
  ].filter(s => s.value > 0);

  // Office performance based on dockets
  const officePerformance = offices
    .map(o => ({
      name: o.name.replace(' Hub', '').replace(' Branch', ''),
      dockets: dockets.filter(d => d.originOffice === o.name || d.destinationOffice === o.name).length,
    }))
    .sort((a, b) => b.dockets - a.dockets)
    .slice(0, 5);

  // Weekly trend (mock data based on actual counts)
  const shipmentTrend = [
    { name: "Mon", shipments: Math.round(totalDockets * 0.12), deliveries: Math.round(totalDockets * 0.10) },
    { name: "Tue", shipments: Math.round(totalDockets * 0.15), deliveries: Math.round(totalDockets * 0.13) },
    { name: "Wed", shipments: Math.round(totalDockets * 0.14), deliveries: Math.round(totalDockets * 0.15) },
    { name: "Thu", shipments: Math.round(totalDockets * 0.17), deliveries: Math.round(totalDockets * 0.16) },
    { name: "Fri", shipments: Math.round(totalDockets * 0.20), deliveries: Math.round(totalDockets * 0.18) },
    { name: "Sat", shipments: Math.round(totalDockets * 0.13), deliveries: Math.round(totalDockets * 0.12) },
    { name: "Sun", shipments: Math.round(totalDockets * 0.09), deliveries: Math.round(totalDockets * 0.08) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your logistics overview.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${kpi.color}`}>
                <kpi.icon className="h-4 w-4 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
              <div className="flex items-center text-xs">
                {kpi.trend === "up" ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )}
                <span className={kpi.trend === "up" ? "text-green-500" : "text-red-500"}>
                  {kpi.change}
                </span>
                <span className="ml-1 text-muted-foreground">vs last week</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Delivered Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{deliveredToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Manifests</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {manifests.filter(m => m.status !== 'closed' && m.status !== 'arrived').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Invoices</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(pendingAmount)} due</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <Receipt className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Shipment Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Shipment Trend</CardTitle>
            <CardDescription>Weekly shipments and deliveries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={shipmentTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                  <YAxis className="text-xs fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="shipments"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    name="Shipments"
                  />
                  <Line
                    type="monotone"
                    dataKey="deliveries"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    dot={false}
                    name="Deliveries"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Docket Status Distribution</CardTitle>
            <CardDescription>Current status of all dockets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Office Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Office Performance</CardTitle>
            <CardDescription>Dockets by office</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={officePerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs fill-muted-foreground" />
                  <YAxis dataKey="name" type="category" className="text-xs fill-muted-foreground" width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Bar dataKey="dockets" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your logistics operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="mt-0.5">
                      {activity.status === "success" && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {activity.status === "pending" && (
                        <Clock className="h-5 w-5 text-yellow-500" />
                      )}
                      {activity.status === "warning" && (
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-foreground">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}
