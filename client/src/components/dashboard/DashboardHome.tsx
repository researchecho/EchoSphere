import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { LucideUsers, LucideGlobe, LucideStore, LucideMail } from 'lucide-react';

export default function DashboardHome() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Welcome to your Echoverse platform dashboard.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Users" 
          value="12" 
          icon={<LucideUsers className="h-5 w-5 text-primary" />} 
        />
        <StatCard 
          title="Active Websites" 
          value="3" 
          icon={<LucideGlobe className="h-5 w-5 text-primary" />} 
        />
        <StatCard 
          title="E-commerce" 
          value="$1,234" 
          icon={<LucideStore className="h-5 w-5 text-primary" />} 
        />
        <StatCard 
          title="Messages" 
          value="8" 
          icon={<LucideMail className="h-5 w-5 text-primary" />} 
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Fast access to common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>
                <a href="/dashboard/websites" className="text-blue-500 hover:underline">
                  Create a new website
                </a>
              </li>
              <li>
                <a href="/dashboard/ecommerce" className="text-blue-500 hover:underline">
                  Manage your products
                </a>
              </li>
              <li>
                <a href="/dashboard/messages" className="text-blue-500 hover:underline">
                  View unread messages
                </a>
              </li>
              <li>
                <a href="/dashboard/settings" className="text-blue-500 hover:underline">
                  Update your profile
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest platform activity</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span>New subscriber joined your newsletter</span>
                <span className="text-muted-foreground">Just now</span>
              </li>
              <li className="flex justify-between">
                <span>Website "Business Site" updated</span>
                <span className="text-muted-foreground">2 hours ago</span>
              </li>
              <li className="flex justify-between">
                <span>New contact message received</span>
                <span className="text-muted-foreground">5 hours ago</span>
              </li>
              <li className="flex justify-between">
                <span>Product "Premium Plan" added</span>
                <span className="text-muted-foreground">Yesterday</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="bg-primary/10 p-2 rounded-full">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}