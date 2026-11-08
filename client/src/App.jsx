import { lazy } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./routes/ProtectedRoute";

// Route-level code splitting: charts (Recharts) and markdown (AI) only load
// when their pages are visited.
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const Customers = lazy(() => import("./pages/customers/Customers"));
const CustomerDetails = lazy(() => import("./pages/customers/CustomerDetails"));
const Products = lazy(() => import("./pages/products/Products"));
const ProductDetails = lazy(() => import("./pages/products/ProductDetails"));
const Patterns = lazy(() => import("./pages/patterns/Patterns"));
const Sales = lazy(() => import("./pages/sales/Sales"));
const SaleForm = lazy(() => import("./pages/sales/SaleForm"));
const SaleDetails = lazy(() => import("./pages/sales/SaleDetails"));
const Reports = lazy(() => import("./pages/reports/Reports"));
const AI = lazy(() => import("./pages/ai/AI"));

const App = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Root → dashboard (ProtectedRoute redirects to /login if signed out) */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Protected application */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetails />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:id" element={<ProductDetails />} />
            <Route path="patterns" element={<Patterns />} />
            <Route path="sales" element={<Sales />} />
            <Route path="sales/new" element={<SaleForm />} />
            <Route path="sales/:id" element={<SaleDetails />} />
            <Route path="sales/:id/edit" element={<SaleForm />} />
            <Route path="reports" element={<Reports />} />
            <Route path="ai" element={<AI />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
};

export default App;
