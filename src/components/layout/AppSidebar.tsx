import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  Warehouse,
  ShoppingCart,
  ClipboardList,
  FileText,
  Truck,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  PackageCheck,
  Route,
  FileCheck,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Track Shipment", url: "/track", icon: QrCode },
];

const operationsItems = [
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Offices", url: "/offices", icon: Building2 },
  { title: "Pickups", url: "/pickups", icon: PackageCheck },
  { title: "Dockets", url: "/dockets", icon: ClipboardList },
  { title: "Manifests", url: "/manifests", icon: Route },
  { title: "Inscan", url: "/inscan", icon: Package },
  { title: "Truck Run Sheet", url: "/delivery-run-sheet", icon: Truck },
  { title: "POD", url: "/pod", icon: FileCheck },
];

const inventoryItems = [
  { title: "Products", url: "/products", icon: Package },
  { title: "Suppliers", url: "/suppliers", icon: Users },
  { title: "Warehouses", url: "/warehouses", icon: Warehouse },
  { title: "Purchase Orders", url: "/purchase-orders", icon: ShoppingCart },
  { title: "GRN", url: "/grn", icon: FileText },
  { title: "Sales Orders", url: "/sales-orders", icon: ClipboardList },
];

const systemItems = [
  { title: "Billing", url: "/billing", icon: FileText },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => location.pathname === path;

  const renderNavItems = (items: typeof mainNavItems) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={isActive(item.url)}>
            <NavLink
              to={item.url}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-sidebar-accent",
                isActive(item.url) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Truck className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sidebar-foreground">LogiFlow</span>
          </div>
        )}
        {collapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary mx-auto">
            <Truck className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
      </div>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-xs font-medium text-muted-foreground mb-2">Main</SidebarGroupLabel>}
          <SidebarGroupContent>{renderNavItems(mainNavItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          {!collapsed && <SidebarGroupLabel className="text-xs font-medium text-muted-foreground mb-2">Operations</SidebarGroupLabel>}
          <SidebarGroupContent>{renderNavItems(operationsItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          {!collapsed && <SidebarGroupLabel className="text-xs font-medium text-muted-foreground mb-2">Inventory</SidebarGroupLabel>}
          <SidebarGroupContent>{renderNavItems(inventoryItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          {!collapsed && <SidebarGroupLabel className="text-xs font-medium text-muted-foreground mb-2">System</SidebarGroupLabel>}
          <SidebarGroupContent>{renderNavItems(systemItems)}</SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
