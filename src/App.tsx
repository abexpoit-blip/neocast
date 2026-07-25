import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute, AdminRoute } from "@/components/AppShell";
import ScrollToTop from "@/components/ScrollToTop";
import { LanguageProvider } from "@/lib/i18n";

import Index from "./pages/Index";
// removed: Landing, Dashboard, News, BuyerRefunds, SuperShop, BoostTool, Tickets, Settings (not part of Scorpion-style nav)
import Auth from "./pages/Auth";
import AdminLogin from "./pages/AdminLogin";
import ResetPassword from "./pages/ResetPassword";
import AdminSettings from "./pages/AdminSettings";
import AdminSiteSettings from "./pages/AdminSiteSettings";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import Recharge from "./pages/Recharge";
import Admin from "./pages/Admin";
import AdminApplications from "./pages/AdminApplications";

import AdminCards from "./pages/AdminCards";
import AdminRefunds from "./pages/AdminRefunds";

import AdminPaymentGateway from "./pages/AdminPaymentGateway";
import AdminPayments from "./pages/AdminPayments";
import AdminStockReview from "./pages/AdminStockReview";

import AdminCategories from "./pages/AdminCategories";
import AdminShop from "./pages/AdminShop";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner theme="light" />
      <BrowserRouter>
        <LanguageProvider>
        <AuthProvider>
          <ScrollToTop />
          <Routes>
            {/* Public auth pages */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/crzr-x9k2-panel" element={<AdminLogin />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin/reset-password" element={<ResetPassword />} />

            {/* Admin routes */}
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
            <Route path="/admin/site" element={<AdminRoute><AdminSiteSettings /></AdminRoute>} />
            <Route path="/admin/applications" element={<AdminRoute><AdminApplications /></AdminRoute>} />
            
            <Route path="/admin/cards" element={<AdminRoute><AdminCards /></AdminRoute>} />
            <Route path="/admin/refunds" element={<AdminRoute><AdminRefunds /></AdminRoute>} />
            
            <Route path="/admin/payments" element={<AdminRoute><AdminPayments /></AdminRoute>} />
            <Route path="/admin/payment-gateway" element={<AdminRoute><AdminPaymentGateway /></AdminRoute>} />
            <Route path="/admin/stock-review" element={<AdminRoute><AdminStockReview /></AdminRoute>} />
            
            <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
            <Route path="/admin/shop" element={<AdminRoute><AdminShop /></AdminRoute>} />

            {/* Buyer routes — Scorpion-style: only 5 nav pages */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/shop" element={<ProtectedRoute><Shop /></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/recharge" element={<ProtectedRoute><Recharge /></ProtectedRoute>} />



            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
