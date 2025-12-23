import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import Home from "@/pages/Home";
import Login from "@/pages/Login";
import AuditList from "@/pages/AuditList";
import AuditSetup from "@/pages/AuditSetup";
import AuditExecution from "@/pages/AuditExecution";
import AuditSummary from "@/pages/AuditSummary";
import CorrectiveActions from "@/pages/CorrectiveActions";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Redirect to login if not authenticated
    // We use setTimeout to avoid React rendering conflicts during state updates
    setTimeout(() => setLocation("/login"), 0);
    return null;
  }

  return (
    <Layout>
      <Component {...rest} />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      {/* Protected Routes */}
      <Route path="/">
        <ProtectedRoute component={Home} />
      </Route>
      
      <Route path="/audits">
        <ProtectedRoute component={AuditList} />
      </Route>
      
      <Route path="/audits/new">
        <ProtectedRoute component={AuditSetup} />
      </Route>
      
      <Route path="/audits/:id">
        <ProtectedRoute component={AuditExecution} />
      </Route>
      
      <Route path="/audits/:id/summary">
        <ProtectedRoute component={AuditSummary} />
      </Route>
      
      <Route path="/actions">
        <ProtectedRoute component={CorrectiveActions} />
      </Route>
      
      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
