import { Authenticated, Refine } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import {
  notificationProvider,
  RefineSnackbarProvider,
} from "@refinedev/mui";
import routerBindings, {
  CatchAllNavigate,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router-v6";
import { dataProvider, liveProvider } from "@refinedev/supabase";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import { BrowserRouter, Route, Routes, Outlet } from "react-router-dom";

// Import both clients from our new consolidated file
import { supabaseClient, supabaseAdminClient } from "./supabase"; 
import { authProvider } from "./authProvider";
import { theme } from "./theme";
import { Layout } from "./components/layout";
import { Login } from "./pages/login";
import { ProductList } from "./pages/products/list";
import { ProductCreate } from "./pages/products/create";
import { ProductEdit } from "./pages/products/edit";
import { ProductBulkCreate } from "./pages/products/bulk-create";
import { FabricList } from "./pages/fabrics/list";
import { FabricCreate } from "./pages/fabrics/create";
import { FabricEdit } from "./pages/fabrics/edit";
import { OrderList } from "./pages/orders/list";
import { OrderShow } from "./pages/orders/show";
import { CustomerList } from "./pages/customers/list";
import { CustomerShow } from "./pages/customers/show";
import { ImageList } from "./pages/images/list";
import { PolicyList } from "./pages/policies/list";
import { PrintList } from "./pages/prints/list";
import { PrintCreate } from "./pages/prints/create";
import { PrintEdit } from "./pages/prints/edit";
import { TShirt, Rows, ShoppingCart, Users, ImageSquare, FileText, Palette } from "phosphor-react";

// Initialize providers with the correct clients
const dataProviderInstance = dataProvider(supabaseAdminClient);
const liveProviderInstance = liveProvider(supabaseAdminClient);

function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <GlobalStyles styles={{ html: { WebkitFontSmoothing: "auto" } }} />
          <RefineSnackbarProvider
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <DevtoolsProvider>
              <Refine
                dataProvider={dataProviderInstance}
                liveProvider={liveProviderInstance}
                authProvider={authProvider}
                notificationProvider={notificationProvider}
                routerProvider={routerBindings}
                resources={[
                  {
                    name: "products",
                    list: "/products",
                    create: "/products/create",
                    edit: "/products/edit/:id",
                    meta: { canDelete: true, icon: <TShirt /> },
                  },
                  {
                    name: "fabrics",
                    list: "/fabrics",
                    create: "/fabrics/create",
                    edit: "/fabrics/edit/:id",
                    meta: { canDelete: true, icon: <Rows /> },
                  },
                  {
                    name: "prints",
                    list: "/prints",
                    create: "/prints/create",
                    edit: "/prints/edit/:id",
                    meta: { canDelete: true, icon: <Palette />, label: "Print Types" },
                  },
                  {
                    name: "images",
                    list: "/images",
                    meta: { canDelete: false, icon: <ImageSquare />, label: "Image Gallery" },
                  },
                   {
                    name: "orders",
                    list: "/orders",
                    show: "/orders/show/:id",
                    meta: { canDelete: false, icon: <ShoppingCart /> },
                  },
                  {
                    name: "customers",
                    list: "/customers",
                    show: "/customers/show/:id",
                    meta: { canDelete: false, icon: <Users /> },
                  },
                  {
                    name: "policies",
                    list: "/policies",
                    meta: { canDelete: false, icon: <FileText />, label: "Policies" },
                  },
                ]}
                options={{
                  syncWithLocation: true,
                  warnWhenUnsavedChanges: true,
                  useNewQueryKeys: true,
                  liveMode: "auto",
                }}
              >
                <Routes>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-internal"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <Layout>
                          <Outlet />
                        </Layout>
                      </Authenticated>
                    }
                  >
                    <Route index element={<NavigateToResource resource="products" />} />
                    <Route path="/products">
                      <Route index element={<ProductList />} />
                      <Route path="create" element={<ProductCreate />} />
                      <Route path="bulk-create" element={<ProductBulkCreate />} />
                      <Route path="edit/:id" element={<ProductEdit />} />
                    </Route>
                    <Route path="/fabrics">
                      <Route index element={<FabricList />} />
                      <Route path="create" element={<FabricCreate />} />
                      <Route path="edit/:id" element={<FabricEdit />} />
                    </Route>
                    <Route path="/prints">
                      <Route index element={<PrintList />} />
                      <Route path="create" element={<PrintCreate />} />
                      <Route path="edit/:id" element={<PrintEdit />} />
                    </Route>
                    <Route path="/images">
                      <Route index element={<ImageList />} />
                    </Route>
                     <Route path="/orders">
                      <Route index element={<OrderList />} />
                      <Route path="show/:id" element={<OrderShow />} />
                    </Route>
                    <Route path="/customers">
                      <Route index element={<CustomerList />} />
                      <Route path="show/:id" element={<CustomerShow />} />
                    </Route>
                    <Route path="/policies">
                      <Route index element={<PolicyList />} />
                    </Route>
                  </Route>
                  <Route
                    element={
                      <Authenticated key="authenticated-outer" fallback={<Outlet />}>
                        <NavigateToResource />
                      </Authenticated>
                    }
                  >
                    <Route path="/login" element={<Login />} />
                  </Route>
                </Routes>
                <RefineKbar />
                <UnsavedChangesNotifier />
                <DevtoolsPanel />
              </Refine>
            </DevtoolsProvider>
          </RefineSnackbarProvider>
        </ThemeProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;