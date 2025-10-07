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
import { FabricList } from "./pages/fabrics/list";
import { FabricCreate } from "./pages/fabrics/create";
import { FabricEdit } from "./pages/fabrics/edit";
import { OrderList } from "./pages/orders/list";
import { OrderShow } from "./pages/orders/show";
import { CustomerList } from "./pages/customers/list";
import { CustomerShow } from "./pages/customers/show";
import { TShirt, Rows, ShoppingCart, Users } from "phosphor-react";

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
                      <Route path="edit/:id" element={<ProductEdit />} />
                    </Route>
                    <Route path="/fabrics">
                      <Route index element={<FabricList />} />
                      <Route path="create" element={<FabricCreate />} />
                      <Route path="edit/:id" element={<FabricEdit />} />
                    </Route>
                     <Route path="/orders">
                      <Route index element={<OrderList />} />
                      <Route path="show/:id" element={<OrderShow />} />
                    </Route>
                    <Route path="/customers">
                      <Route index element={<CustomerList />} />
                      <Route path="show/:id" element={<CustomerShow />} />
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