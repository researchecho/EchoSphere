import React from 'react';
import { Route } from 'wouter';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHome from '../components/dashboard/DashboardHome';
import UsersPanel from '../components/dashboard/UsersPanel';
import WebsitesPanel from '../components/dashboard/WebsitesPanel';
import EcommercePanel from '../components/dashboard/EcommercePanel';
import MessagesPanel from '../components/dashboard/MessagesPanel';
import SettingsPanel from '../components/dashboard/SettingsPanel';
import AIPanel from '../components/dashboard/AIPanel';
import SocialPanel from '../components/dashboard/SocialPanel';
import EducationPanel from '../components/dashboard/EducationPanel';
import JobsPanel from '../components/dashboard/JobsPanel';
import BookingPanel from '../components/dashboard/BookingPanel';

interface ProtectedRouteProps {
  component: React.ComponentType;
  allowedRoles: string[];
  userRole?: string;
}

function ProtectedRoute({ component: Component, allowedRoles, userRole = 'user' }: ProtectedRouteProps) {
  if (!allowedRoles.includes(userRole)) {
    return <div className="p-4">You don't have permission to access this page.</div>;
  }
  return <Component />;
}

export default function Dashboard() {
  // In a real app, get this from auth context
  const userRole = 'admin';
  
  return (
    <DashboardLayout>
      <Route path="/dashboard" component={() => 
        <ProtectedRoute 
          component={DashboardHome} 
          allowedRoles={['admin', 'manager', 'user']} 
          userRole={userRole} 
        />
      } />
      <Route path="/dashboard/users" component={() => 
        <ProtectedRoute 
          component={UsersPanel} 
          allowedRoles={['admin']} 
          userRole={userRole} 
        />
      } />
      <Route path="/dashboard/websites" component={() => 
        <ProtectedRoute 
          component={WebsitesPanel} 
          allowedRoles={['admin', 'manager']} 
          userRole={userRole} 
        />
      } />
      <Route path="/dashboard/ecommerce" component={() => 
        <ProtectedRoute 
          component={EcommercePanel} 
          allowedRoles={['admin', 'manager']} 
          userRole={userRole} 
        />
      } />
      <Route path="/dashboard/ai" component={() => 
        <ProtectedRoute 
          component={AIPanel} 
          allowedRoles={['admin', 'manager', 'user']} 
          userRole={userRole} 
        />
      } />
      <Route path="/dashboard/social" component={SocialPanel} />
      <Route path="/dashboard/education" component={() => 
        <ProtectedRoute 
          component={EducationPanel} 
          allowedRoles={['admin', 'manager']} 
          userRole={userRole} 
        />
      } />
      <Route path="/dashboard/jobs" component={() => 
        <ProtectedRoute 
          component={JobsPanel} 
          allowedRoles={['admin', 'manager']} 
          userRole={userRole} 
        />
      } />
      <Route path="/dashboard/booking" component={() => 
        <ProtectedRoute 
          component={BookingPanel} 
          allowedRoles={['admin', 'manager']} 
          userRole={userRole} 
        />
      } />
      <Route path="/dashboard/messages" component={() => 
        <ProtectedRoute 
          component={MessagesPanel} 
          allowedRoles={['admin', 'manager', 'user']} 
          userRole={userRole} 
        />
      } />
      <Route path="/dashboard/settings" component={() => 
        <ProtectedRoute 
          component={SettingsPanel} 
          allowedRoles={['admin', 'manager', 'user']} 
          userRole={userRole} 
        />
      } />
    </DashboardLayout>
  );
}