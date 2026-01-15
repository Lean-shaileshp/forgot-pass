import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Offices from "./pages/Offices";
import Pickups from "./pages/Pickups";
import Dockets from "./pages/Dockets";
import Manifests from "./pages/Manifests";
import Inscan from "./pages/Inscan";
import DeliveryRunSheet from "./pages/DeliveryRunSheet";
import POD from "./pages/POD";
import Products from "./pages/Products";
import Suppliers from "./pages/Suppliers";
import Warehouses from "./pages/Warehouses";
import PurchaseOrders from "./pages/PurchaseOrders";
import GRN from "./pages/GRN";
import SalesOrders from "./pages/SalesOrders";
import Billing from "./pages/Billing";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import TrackShipment from "./pages/TrackShipment";
import NotFound from "./pages/NotFound";
import Registration from "./pages/Registration";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute requiredModule="customers"><AppLayout><Customers /></AppLayout></ProtectedRoute>} />
              <Route path="/offices" element={<ProtectedRoute requiredModule="offices"><AppLayout><Offices /></AppLayout></ProtectedRoute>} />
              <Route path="/pickups" element={<ProtectedRoute requiredModule="pickups"><AppLayout><Pickups /></AppLayout></ProtectedRoute>} />
              <Route path="/dockets" element={<ProtectedRoute requiredModule="dockets"><AppLayout><Dockets /></AppLayout></ProtectedRoute>} />
              <Route path="/manifests" element={<ProtectedRoute requiredModule="manifests"><AppLayout><Manifests /></AppLayout></ProtectedRoute>} />
              <Route path="/inscan" element={<ProtectedRoute requiredModule="inscan"><AppLayout><Inscan /></AppLayout></ProtectedRoute>} />
              <Route path="/delivery-run-sheet" element={<ProtectedRoute requiredModule="drs"><AppLayout><DeliveryRunSheet /></AppLayout></ProtectedRoute>} />
              <Route path="/pod" element={<ProtectedRoute requiredModule="pod"><AppLayout><POD /></AppLayout></ProtectedRoute>} />
              <Route path="/products" element={<ProtectedRoute requiredModule="products"><AppLayout><Products /></AppLayout></ProtectedRoute>} />
              <Route path="/suppliers" element={<ProtectedRoute requiredModule="suppliers"><AppLayout><Suppliers /></AppLayout></ProtectedRoute>} />
              <Route path="/warehouses" element={<ProtectedRoute requiredModule="warehouses"><AppLayout><Warehouses /></AppLayout></ProtectedRoute>} />
              <Route path="/purchase-orders" element={<ProtectedRoute requiredModule="purchase_orders"><AppLayout><PurchaseOrders /></AppLayout></ProtectedRoute>} />
              <Route path="/grn" element={<ProtectedRoute requiredModule="grn"><AppLayout><GRN /></AppLayout></ProtectedRoute>} />
              <Route path="/sales-orders" element={<ProtectedRoute requiredModule="sales_orders"><AppLayout><SalesOrders /></AppLayout></ProtectedRoute>} />
              <Route path="/billing" element={<ProtectedRoute requiredModule="billing"><AppLayout><Billing /></AppLayout></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute requiredModule="reports"><AppLayout><Reports /></AppLayout></ProtectedRoute>} />
              <Route path="/register" element={<ProtectedRoute requiredModule="register"><AppLayout><Registration /></ AppLayout></ProtectedRoute>}></Route>
              <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
              <Route path="/track" element={<ProtectedRoute><AppLayout><TrackShipment /></AppLayout></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
