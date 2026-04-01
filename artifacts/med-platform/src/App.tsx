import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import PatientsList from "@/pages/patients";
import NewPatient from "@/pages/patients/new";
import EditPatient from "@/pages/patients/edit";
import PatientDetail from "@/pages/patients/[id]";
import UsersList from "@/pages/users";
import NewUser from "@/pages/users/new";
import EditUser from "@/pages/users/edit";
import VerifyPage from "@/pages/verify/[uuid]";
import VerifyStandalone from "@/pages/verify/index";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect to="/login" />;
  
  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/verify" component={VerifyStandalone} />
      <Route path="/verify/:uuid" component={VerifyPage} />
      
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/patients"><ProtectedRoute component={PatientsList} /></Route>
      <Route path="/patients/new"><ProtectedRoute component={NewPatient} /></Route>
      <Route path="/patients/:id/edit"><ProtectedRoute component={EditPatient} /></Route>
      <Route path="/patients/:id"><ProtectedRoute component={PatientDetail} /></Route>
      <Route path="/users"><ProtectedRoute component={UsersList} /></Route>
      <Route path="/users/new"><ProtectedRoute component={NewUser} /></Route>
      <Route path="/users/:id/edit"><ProtectedRoute component={EditUser} /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
