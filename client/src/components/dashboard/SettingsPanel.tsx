import React, { useState } from 'react';
import {
  LucideUser,
  LucideShield,
  LucideCreditCard,
  LucideGlobe,
  LucideBell,
  LucideMail,
  LucideCheck,
  LucideKey,
  LucideSave
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export default function SettingsPanel() {
  const [activeTab, setActiveTab] = useState('account');
  const [profileForm, setProfileForm] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    bio: 'Software developer and tech enthusiast passionate about building innovative products.',
    company: 'Acme Corp',
    website: 'https://johndoe.com',
    location: 'San Francisco, CA'
  });
  
  const [securityForm, setSecurityForm] = useState({
    twoFactorEnabled: true,
    emailNotifications: true,
    activityAlerts: false,
    marketingEmails: true
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email: {
      activities: true,
      updates: true,
      marketing: false
    },
    push: {
      activities: true,
      updates: false
    }
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSecurityToggle = (setting: keyof typeof securityForm) => {
    setSecurityForm(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleNotificationToggle = (
    type: 'email' | 'push',
    setting: string
  ) => {
    setNotificationSettings(prev => {
      // Create a safe copy of the previous state
      const result = { ...prev };
      
      // Update the specific setting
      if (type === 'email') {
        result.email = {
          ...result.email,
          [setting]: !result.email[setting as keyof typeof result.email]
        };
      } else {
        result.push = {
          ...result.push,
          [setting]: !result.push[setting as keyof typeof result.push]
        };
      }
      
      return result;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <Tabs defaultValue="account" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 md:w-fit gap-1">
          <TabsTrigger value="account" className="flex items-center justify-center">
            <LucideUser className="h-4 w-4 mr-2" />
            <span>Account</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center justify-center">
            <LucideShield className="h-4 w-4 mr-2" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center justify-center">
            <LucideCreditCard className="h-4 w-4 mr-2" />
            <span>Billing</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center justify-center">
            <LucideBell className="h-4 w-4 mr-2" />
            <span>Notifications</span>
          </TabsTrigger>
        </TabsList>

        {/* Account Settings Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                This information will be displayed publicly so be careful what you share.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="/placeholder-user.jpg" alt="Profile" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-medium">Profile Picture</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Upload New</Button>
                    <Button variant="ghost" size="sm">Remove</Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    name="email"
                    type="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea 
                    id="bio"
                    name="bio"
                    rows={4}
                    value={profileForm.bio}
                    onChange={handleProfileChange}
                    placeholder="Write a few sentences about yourself."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input 
                    id="company"
                    name="company"
                    value={profileForm.company}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location"
                    name="location"
                    value={profileForm.location}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input 
                    id="website"
                    name="website"
                    value={profileForm.website}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="default">
                <LucideSave className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>
                Connect your accounts to enable single sign-on and additional features.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                  </div>
                  <div>
                    <p className="font-medium">Twitter</p>
                    <p className="text-sm text-muted-foreground">@johndoe</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Disconnect</Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 dark:text-gray-400"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path></svg>
                  </div>
                  <div>
                    <p className="font-medium">GitHub</p>
                    <p className="text-sm text-muted-foreground">github.com/johndoe</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Disconnect</Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-700 dark:text-blue-300"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                  </div>
                  <div>
                    <p className="font-medium">LinkedIn</p>
                    <p className="text-sm text-muted-foreground">Not connected</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Connect</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>
                Permanent actions that can't be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border p-4 rounded-md">
                <div>
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all of your content.
                  </p>
                </div>
                <Button variant="destructive">Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Change your password or enable two-factor authentication.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Change Password</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">
                    Protect your account with an additional verification step.
                  </p>
                </div>
                <Switch 
                  checked={securityForm.twoFactorEnabled}
                  onCheckedChange={() => handleSecurityToggle('twoFactorEnabled')}
                />
              </div>
              {securityForm.twoFactorEnabled && (
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <div className="flex items-center gap-2 mb-4">
                    <LucideKey className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">Two-factor authentication is enabled</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    You've added an extra layer of security to your account by requiring a 
                    verification code in addition to your password.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Setup Authenticator App</Button>
                    <Button variant="ghost" size="sm">Get Recovery Codes</Button>
                  </div>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium">Activity Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts about suspicious activity on your account.
                  </p>
                </div>
                <Switch 
                  checked={securityForm.activityAlerts}
                  onCheckedChange={() => handleSecurityToggle('activityAlerts')}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Manage your active sessions across devices.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-md">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <LucideCheck className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Current Session</p>
                    <p className="text-sm text-muted-foreground">
                      Chrome on macOS • San Francisco, CA • Active now
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full">
                    <LucideGlobe className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Safari on iPhone</p>
                    <p className="text-sm text-muted-foreground">
                      New York, NY • Last active 2 days ago
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">Sign Out</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full">
                    <LucideGlobe className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Firefox on Windows</p>
                    <p className="text-sm text-muted-foreground">
                      Seattle, WA • Last active 1 week ago
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">Sign Out</Button>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline">Sign Out All Other Sessions</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Billing Settings Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plan</CardTitle>
              <CardDescription>
                Manage your subscription and billing information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-md">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">Premium Plan</h3>
                    <p className="text-muted-foreground">$99.99 / month</p>
                  </div>
                  <Badge>Current Plan</Badge>
                </div>
                <p className="text-sm mb-4">
                  Your subscription renews on May 15, 2023. You can cancel anytime.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline">Change Plan</Button>
                  <Button variant="ghost" className="text-red-500 hover:text-red-600">
                    Cancel Subscription
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Manage your payment methods and billing information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <LucideCreditCard className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">•••• •••• •••• 4242</p>
                    <p className="text-sm text-muted-foreground">
                      Visa • Expires 04/2025
                    </p>
                  </div>
                </div>
                <Badge>Default</Badge>
              </div>
              <Button variant="outline" className="w-full">
                Add Payment Method
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                View your billing history and download invoices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium">Invoice #123456</p>
                    <p className="text-sm text-muted-foreground">April 1, 2023</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-medium">$99.99</p>
                    <Button variant="ghost" size="sm">Download</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium">Invoice #123455</p>
                    <p className="text-sm text-muted-foreground">March 1, 2023</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-medium">$99.99</p>
                    <Button variant="ghost" size="sm">Download</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium">Invoice #123454</p>
                    <p className="text-sm text-muted-foreground">February 1, 2023</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-medium">$99.99</p>
                    <Button variant="ghost" size="sm">Download</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Choose what emails you'll receive from us.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Activity Notifications</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive emails about your account activity.
                  </p>
                </div>
                <Switch 
                  checked={notificationSettings.email.activities}
                  onCheckedChange={() => handleNotificationToggle('email', 'activities')}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Updates & Announcements</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive emails about product updates and new features.
                  </p>
                </div>
                <Switch 
                  checked={notificationSettings.email.updates}
                  onCheckedChange={() => handleNotificationToggle('email', 'updates')}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Marketing Emails</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive marketing emails and promotional offers.
                  </p>
                </div>
                <Switch 
                  checked={notificationSettings.email.marketing}
                  onCheckedChange={() => handleNotificationToggle('email', 'marketing')}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Push Notifications</CardTitle>
              <CardDescription>
                Configure what push notifications you want to receive.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Activity Notifications</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications about your account activity.
                  </p>
                </div>
                <Switch 
                  checked={notificationSettings.push.activities}
                  onCheckedChange={() => handleNotificationToggle('push', 'activities')}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Updates & Announcements</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications about product updates and new features.
                  </p>
                </div>
                <Switch 
                  checked={notificationSettings.push.updates}
                  onCheckedChange={() => handleNotificationToggle('push', 'updates')}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Save Notification Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}