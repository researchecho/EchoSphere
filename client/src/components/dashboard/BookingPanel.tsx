import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Calendar, 
  Search, 
  Plus, 
  Clock, 
  Users, 
  MapPin, 
  CheckCircle, 
  MoreVertical, 
  Edit, 
  Trash, 
  Eye, 
  CalendarDays,
  CalendarOff,
  ChevronLeft,
  ChevronRight,
  Palette,
  X,
  Clock3,
  DollarSign,
  UserRound,
  Phone,
  Mail,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/components/ui/hover-card';
import { Switch } from '@/components/ui/switch';

// Types for booking components
type BookingService = {
  id: number;
  userId: number;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number; // in cents
  color: string;
  bufferTimeBefore: number;
  bufferTimeAfter: number;
  maxAttendees: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  appointmentsCount?: number;
};

type BookingAvailability = {
  id: number;
  userId: number;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "17:00"
  isAvailable: boolean;
};

type BookingBlackoutDate = {
  id: number;
  userId: number;
  startDate: string;
  endDate: string;
  reason: string;
  createdAt: string;
};

type BookingAppointment = {
  id: number;
  serviceId: number;
  providerId: number;
  clientId?: number;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  startTime: string;
  endTime: string;
  notes?: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  cancellationReason?: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: string;
  updatedAt: string;
  service?: BookingService;
  provider?: {
    id: number;
    username: string;
    fullName?: string;
  };
  client?: {
    id: number;
    username: string;
    fullName?: string;
    email: string;
  };
};

export default function BookingPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('appointments');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [blackoutDateDialogOpen, setBlackoutDateDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<number | null>(null);
  
  const [newService, setNewService] = useState<{
    name: string;
    description: string;
    duration: string;
    price: string;
    color: string;
    bufferTimeBefore: string;
    bufferTimeAfter: string;
    maxAttendees: string;
  }>({
    name: '',
    description: '',
    duration: '60',
    price: '',
    color: '#4f46e5',
    bufferTimeBefore: '0',
    bufferTimeAfter: '0',
    maxAttendees: '1',
  });
  
  const [newBlackoutDate, setNewBlackoutDate] = useState<{
    startDate: string;
    endDate: string;
    reason: string;
  }>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
  });

  // Define default weekly availability
  const defaultAvailability = [
    { dayOfWeek: 0, isAvailable: false, startTime: '09:00', endTime: '17:00' }, // Sunday
    { dayOfWeek: 1, isAvailable: true, startTime: '09:00', endTime: '17:00' }, // Monday
    { dayOfWeek: 2, isAvailable: true, startTime: '09:00', endTime: '17:00' }, // Tuesday
    { dayOfWeek: 3, isAvailable: true, startTime: '09:00', endTime: '17:00' }, // Wednesday
    { dayOfWeek: 4, isAvailable: true, startTime: '09:00', endTime: '17:00' }, // Thursday
    { dayOfWeek: 5, isAvailable: true, startTime: '09:00', endTime: '17:00' }, // Friday
    { dayOfWeek: 6, isAvailable: false, startTime: '09:00', endTime: '17:00' }, // Saturday
  ];

  const [availability, setAvailability] = useState(defaultAvailability);

  // Fetch booking services
  const { data: services = [], isLoading: isLoadingServices } = useQuery({
    queryKey: ['/api/booking/services'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/booking/services');
      const json = await res.json();
      return json.data?.services || [];
    },
  });

  // Fetch appointments
  const { data: appointments = [], isLoading: isLoadingAppointments } = useQuery({
    queryKey: ['/api/booking/appointments'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/booking/appointments');
      const json = await res.json();
      return json.data?.appointments || [];
    },
  });

  // Fetch blackout dates
  const { data: blackoutDates = [], isLoading: isLoadingBlackoutDates } = useQuery({
    queryKey: ['/api/booking/blackout-dates'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/booking/blackout-dates');
      const json = await res.json();
      return json.data?.blackoutDates || [];
    },
  });

  // Fetch appointment details if selected
  const { data: appointmentDetails, isLoading: isLoadingAppointmentDetails } = useQuery({
    queryKey: ['/api/booking/appointments', selectedAppointment],
    queryFn: async () => {
      if (!selectedAppointment) return null;
      const res = await apiRequest('GET', `/api/booking/appointments/${selectedAppointment}`);
      const json = await res.json();
      return json.data?.appointment || null;
    },
    enabled: !!selectedAppointment,
  });

  // Create a new service
  const createServiceMutation = useMutation({
    mutationFn: async (serviceData: any) => {
      const res = await apiRequest('POST', '/api/booking/services', serviceData);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/booking/services'] });
      setServiceFormOpen(false);
      setNewService({
        name: '',
        description: '',
        duration: '60',
        price: '',
        color: '#4f46e5',
        bufferTimeBefore: '0',
        bufferTimeAfter: '0',
        maxAttendees: '1',
      });
      toast({
        title: 'Success',
        description: 'Service created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create service: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Create a new blackout date
  const createBlackoutDateMutation = useMutation({
    mutationFn: async (blackoutData: any) => {
      const res = await apiRequest('POST', '/api/booking/blackout-dates', blackoutData);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/booking/blackout-dates'] });
      setBlackoutDateDialogOpen(false);
      setNewBlackoutDate({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: '',
      });
      toast({
        title: 'Success',
        description: 'Blackout date added successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to add blackout date: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete a blackout date
  const deleteBlackoutDateMutation = useMutation({
    mutationFn: async (blackoutDateId: number) => {
      const res = await apiRequest('DELETE', `/api/booking/blackout-dates/${blackoutDateId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/booking/blackout-dates'] });
      toast({
        title: 'Success',
        description: 'Blackout date removed',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to remove blackout date: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update appointment status
  const updateAppointmentStatusMutation = useMutation({
    mutationFn: async ({ appointmentId, status }: { appointmentId: number, status: string }) => {
      const res = await apiRequest('PATCH', `/api/booking/appointments/${appointmentId}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/booking/appointments'] });
      toast({
        title: 'Success',
        description: 'Appointment status updated',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update appointment status: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    
    const serviceData = {
      name: newService.name,
      description: newService.description,
      duration: parseInt(newService.duration),
      price: newService.price ? parseInt(newService.price) * 100 : 0, // Convert to cents
      color: newService.color,
      bufferTimeBefore: parseInt(newService.bufferTimeBefore),
      bufferTimeAfter: parseInt(newService.bufferTimeAfter),
      maxAttendees: parseInt(newService.maxAttendees),
    };
    
    createServiceMutation.mutate(serviceData);
  };

  const handleCreateBlackoutDate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (new Date(newBlackoutDate.startDate) > new Date(newBlackoutDate.endDate)) {
      toast({
        title: 'Invalid date range',
        description: 'End date must be after start date',
        variant: 'destructive',
      });
      return;
    }
    
    createBlackoutDateMutation.mutate(newBlackoutDate);
  };

  // Helper functions
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours));
    date.setMinutes(parseInt(minutes));
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString();
  };

  const getDayName = (dayIndex: number) => {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex];
  };

  // Filtering functions
  const filteredServices = services.filter((service: BookingService) => {
    return service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           service.description?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredAppointments = appointments.filter((appointment: BookingAppointment) => {
    let matches = appointment.service?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 appointment.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 appointment.clientEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus && filterStatus !== 'all') {
      matches = matches && appointment.status === filterStatus;
    }
    
    return matches;
  });

  // Get appointments for the selected date
  const getAppointmentsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    
    return appointments.filter((appointment: BookingAppointment) => {
      const appointmentDate = new Date(appointment.startTime).toISOString().split('T')[0];
      return appointmentDate === dateString;
    });
  };

  const appointmentsForSelectedDate = getAppointmentsForDate(selectedDate);

  // Check if a date is a blackout date
  const isBlackoutDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    
    return blackoutDates.some((blackout: BookingBlackoutDate) => {
      const startDate = new Date(blackout.startDate).toISOString().split('T')[0];
      const endDate = new Date(blackout.endDate).toISOString().split('T')[0];
      
      return dateString >= startDate && dateString <= endDate;
    });
  };

  // Navigation for calendar
  const goToPreviousDay = () => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    setSelectedDate(prevDate);
  };

  const goToNextDay = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    setSelectedDate(nextDate);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Booking System</h2>
          <p className="text-muted-foreground">
            Manage your services, availability, and appointments.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search appointments..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select
                value={filterStatus || 'all'}
                onValueChange={setFilterStatus}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Calendar sidebar */}
            <Card className="md:col-span-1">
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <CardTitle>Calendar</CardTitle>
                  <div className="flex space-x-1">
                    <Button variant="outline" size="icon" onClick={goToPreviousDay}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={goToNextDay}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="mb-4">
                  <div className="text-xl font-semibold">
                    {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                  </div>
                  {isBlackoutDate(selectedDate) && (
                    <Badge variant="destructive" className="mt-1">Unavailable Day</Badge>
                  )}
                </div>
                
                <Dialog open={blackoutDateDialogOpen} onOpenChange={setBlackoutDateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      size="sm"
                    >
                      <CalendarOff className="h-4 w-4 mr-2" />
                      Add Blackout Date
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Blackout Date</DialogTitle>
                      <DialogDescription>
                        Mark dates as unavailable for appointments.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateBlackoutDate} className="space-y-4">
                      <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                              id="startDate"
                              type="date"
                              value={newBlackoutDate.startDate}
                              onChange={(e) => setNewBlackoutDate({ ...newBlackoutDate, startDate: e.target.value })}
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                              id="endDate"
                              type="date"
                              value={newBlackoutDate.endDate}
                              onChange={(e) => setNewBlackoutDate({ ...newBlackoutDate, endDate: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="reason">Reason (Optional)</Label>
                          <Input
                            id="reason"
                            placeholder="e.g., Holiday, Vacation, etc."
                            value={newBlackoutDate.reason}
                            onChange={(e) => setNewBlackoutDate({ ...newBlackoutDate, reason: e.target.value })}
                          />
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button type="submit" disabled={createBlackoutDateMutation.isPending}>
                          {createBlackoutDateMutation.isPending ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <CalendarOff className="h-4 w-4 mr-2" />
                          )}
                          Add Blackout Date
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                
                <Separator className="my-4" />
                
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">Appointments for this day</h3>
                  
                  {isLoadingAppointments ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : appointmentsForSelectedDate.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="mx-auto h-12 w-12 mb-2 opacity-20" />
                      <p>No appointments scheduled</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {appointmentsForSelectedDate.map((appointment: BookingAppointment) => {
                        const startTime = new Date(appointment.startTime);
                        const endTime = new Date(appointment.endTime);
                        
                        return (
                          <Card key={appointment.id} className="overflow-hidden">
                            <div 
                              className="h-1" 
                              style={{ backgroundColor: appointment.service?.color || '#4f46e5' }}
                            ></div>
                            <CardContent className="p-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium text-sm">{appointment.service?.name}</h4>
                                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                                    <Clock className="h-3 w-3 mr-1" />
                                    <span>
                                      {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                                      {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <div className="mt-2 text-xs">
                                    <span className="font-medium">Client: </span>
                                    {appointment.clientName || appointment.client?.fullName || appointment.client?.username}
                                  </div>
                                </div>
                                
                                <Badge 
                                  variant={
                                    appointment.status === 'completed' 
                                      ? 'default' 
                                      : appointment.status === 'confirmed' 
                                        ? 'outline' 
                                        : appointment.status === 'cancelled'
                                          ? 'destructive'
                                          : 'secondary'
                                  }
                                  className="ml-auto"
                                >
                                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                </Badge>
                              </div>
                              
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="w-full mt-2"
                                onClick={() => setSelectedAppointment(appointment.id)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View Details
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Appointments list */}
            <Card className="md:col-span-2">
              <CardHeader className="p-4">
                <CardTitle>All Appointments</CardTitle>
                <CardDescription>View and manage all scheduled appointments</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="rounded-md border-0">
                  <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                      <thead>
                        <tr className="border-b transition-colors hover:bg-muted/50">
                          <th className="h-12 px-4 text-left align-middle font-medium">Service</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Client</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Date & Time</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoadingAppointments ? (
                          Array(5).fill(0).map((_, index) => (
                            <tr key={index} className="border-b transition-colors hover:bg-muted/50">
                              <td className="p-4 align-middle">
                                <div className="bg-muted rounded h-4 w-24"></div>
                              </td>
                              <td className="p-4 align-middle">
                                <div className="bg-muted rounded h-4 w-32"></div>
                              </td>
                              <td className="p-4 align-middle">
                                <div className="bg-muted rounded h-4 w-36"></div>
                              </td>
                              <td className="p-4 align-middle">
                                <div className="bg-muted rounded h-4 w-20"></div>
                              </td>
                              <td className="p-4 align-middle">
                                <div className="bg-muted rounded h-8 w-8"></div>
                              </td>
                            </tr>
                          ))
                        ) : filteredAppointments.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="h-32 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <Calendar className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
                                <p className="text-lg font-medium mb-2">No appointments found</p>
                                <p className="text-muted-foreground">
                                  {searchQuery || filterStatus ? 'Try different search criteria' : 'No one has booked appointments yet'}
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredAppointments.map((appointment: BookingAppointment) => {
                            const startTime = new Date(appointment.startTime);
                            
                            return (
                              <tr key={appointment.id} className="border-b transition-colors hover:bg-muted/50">
                                <td className="p-4 align-middle">
                                  <div>
                                    <div 
                                      className="w-3 h-3 rounded-full inline-block mr-2" 
                                      style={{ backgroundColor: appointment.service?.color || '#4f46e5' }}
                                    ></div>
                                    <span className="font-medium">{appointment.service?.name}</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {formatDuration(appointment.service?.duration || 0)}
                                  </div>
                                </td>
                                <td className="p-4 align-middle">
                                  <div>
                                    <div className="font-medium">
                                      {appointment.clientName || 
                                       appointment.client?.fullName || 
                                       appointment.client?.username}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {appointment.clientEmail || appointment.client?.email}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 align-middle">
                                  <div>
                                    <div className="font-medium">
                                      {startTime.toLocaleDateString()}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 align-middle">
                                  <Badge 
                                    variant={
                                      appointment.status === 'completed' 
                                        ? 'default' 
                                        : appointment.status === 'confirmed' 
                                          ? 'outline' 
                                          : appointment.status === 'cancelled'
                                            ? 'destructive'
                                            : 'secondary'
                                    }
                                  >
                                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                  </Badge>
                                </td>
                                <td className="p-4 align-middle">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => setSelectedAppointment(appointment.id)}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                      <DropdownMenuItem
                                        onClick={() => updateAppointmentStatusMutation.mutate({ 
                                          appointmentId: appointment.id, 
                                          status: 'confirmed' 
                                        })}
                                        disabled={appointment.status === 'confirmed'}
                                      >
                                        Mark as Confirmed
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => updateAppointmentStatusMutation.mutate({ 
                                          appointmentId: appointment.id, 
                                          status: 'completed' 
                                        })}
                                        disabled={appointment.status === 'completed'}
                                        className="text-green-600"
                                      >
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Mark as Completed
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => updateAppointmentStatusMutation.mutate({ 
                                          appointmentId: appointment.id, 
                                          status: 'cancelled' 
                                        })}
                                        disabled={appointment.status === 'cancelled'}
                                        className="text-destructive"
                                      >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Cancel Appointment
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => updateAppointmentStatusMutation.mutate({ 
                                          appointmentId: appointment.id, 
                                          status: 'no_show' 
                                        })}
                                        disabled={appointment.status === 'no_show'}
                                      >
                                        Mark as No-show
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Appointment details dialog */}
          {selectedAppointment && (
            <Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Appointment Details</DialogTitle>
                </DialogHeader>
                
                {isLoadingAppointmentDetails ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : appointmentDetails && (
                  <div className="space-y-4">
                    <div 
                      className="h-2 rounded-t-md -mt-6 -mx-6" 
                      style={{ backgroundColor: appointmentDetails.service?.color || '#4f46e5' }}
                    ></div>
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{appointmentDetails.service?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {appointmentDetails.service?.description}
                        </p>
                      </div>
                      <Badge 
                        variant={
                          appointmentDetails.status === 'completed' 
                            ? 'default' 
                            : appointmentDetails.status === 'confirmed' 
                              ? 'outline' 
                              : appointmentDetails.status === 'cancelled'
                                ? 'destructive'
                                : 'secondary'
                        }
                      >
                        {appointmentDetails.status.charAt(0).toUpperCase() + appointmentDetails.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Date & Time</h4>
                        <div className="flex items-center">
                          <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>
                            {new Date(appointmentDetails.startTime).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center mt-1">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>
                            {new Date(appointmentDetails.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                            {new Date(appointmentDetails.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Duration & Price</h4>
                        <div className="flex items-center">
                          <Clock3 className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{formatDuration(appointmentDetails.service?.duration || 0)}</span>
                        </div>
                        <div className="flex items-center mt-1">
                          <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>
                            {appointmentDetails.service?.price 
                              ? `$${(appointmentDetails.service.price / 100).toFixed(2)}` 
                              : 'Free'}
                          </span>
                          <Badge 
                            variant="outline" 
                            className="ml-2"
                          >
                            {appointmentDetails.paymentStatus}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Client Information</h4>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <UserRound className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>
                            {appointmentDetails.clientName || 
                             appointmentDetails.client?.fullName || 
                             appointmentDetails.client?.username}
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>
                            {appointmentDetails.clientEmail || appointmentDetails.client?.email}
                          </span>
                        </div>
                        
                        {appointmentDetails.clientPhone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{appointmentDetails.clientPhone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {appointmentDetails.notes && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-medium mb-2">Notes</h4>
                          <p className="text-sm">{appointmentDetails.notes}</p>
                        </div>
                      </>
                    )}
                    
                    <Separator />
                    
                    <div className="flex justify-between">
                      <Button 
                        variant="outline"
                        onClick={() => setSelectedAppointment(null)}
                      >
                        Close
                      </Button>
                      
                      <div className="space-x-2">
                        {appointmentDetails.status !== 'completed' && (
                          <Button
                            onClick={() => {
                              updateAppointmentStatusMutation.mutate({ 
                                appointmentId: appointmentDetails.id, 
                                status: 'completed' 
                              });
                              setSelectedAppointment(null);
                            }}
                            disabled={updateAppointmentStatusMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Complete
                          </Button>
                        )}
                        
                        {appointmentDetails.status !== 'cancelled' && (
                          <Button
                            variant="destructive"
                            onClick={() => {
                              updateAppointmentStatusMutation.mutate({ 
                                appointmentId: appointmentDetails.id, 
                                status: 'cancelled' 
                              });
                              setSelectedAppointment(null);
                            }}
                            disabled={updateAppointmentStatusMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative w-80">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button onClick={() => setServiceFormOpen(!serviceFormOpen)}>
              <Plus className="h-4 w-4 mr-2" />
              {serviceFormOpen ? 'Cancel' : 'Create Service'}
            </Button>
          </div>

          {serviceFormOpen && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Create New Service</CardTitle>
                <CardDescription>Set up a bookable service for your clients</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateService} className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Service Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Consultation, Haircut, etc."
                        value={newService.name}
                        onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe what's included in this service"
                        value={newService.description}
                        onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="duration">Duration (minutes)</Label>
                        <Input
                          id="duration"
                          type="number"
                          min="5"
                          step="5"
                          value={newService.duration}
                          onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
                          required
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="price">Price (USD)</Label>
                        <Input
                          id="price"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g., 49.99 (leave empty for free)"
                          value={newService.price}
                          onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="color">Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="color"
                          type="color"
                          className="w-12 h-8 p-1"
                          value={newService.color}
                          onChange={(e) => setNewService({ ...newService, color: e.target.value })}
                        />
                        <span className="text-sm text-muted-foreground">
                          Choose a color to represent this service on your calendar
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="bufferTimeBefore">Buffer Time Before (min)</Label>
                        <Input
                          id="bufferTimeBefore"
                          type="number"
                          min="0"
                          step="5"
                          value={newService.bufferTimeBefore}
                          onChange={(e) => setNewService({ ...newService, bufferTimeBefore: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Preparation time needed before appointments
                        </p>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="bufferTimeAfter">Buffer Time After (min)</Label>
                        <Input
                          id="bufferTimeAfter"
                          type="number"
                          min="0"
                          step="5"
                          value={newService.bufferTimeAfter}
                          onChange={(e) => setNewService({ ...newService, bufferTimeAfter: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Clean-up time needed after appointments
                        </p>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="maxAttendees">Max Attendees</Label>
                        <Input
                          id="maxAttendees"
                          type="number"
                          min="1"
                          value={newService.maxAttendees}
                          onChange={(e) => setNewService({ ...newService, maxAttendees: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Maximum people per booking slot
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createServiceMutation.isPending}
                  >
                    {createServiceMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Create Service
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingServices ? (
              Array(3).fill(0).map((_, index) => (
                <Card key={index} className="opacity-50">
                  <CardHeader className="p-4">
                    <div className="bg-muted rounded h-6 w-3/4 mb-2"></div>
                    <div className="bg-muted rounded h-4 w-1/2"></div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="bg-muted rounded h-4 w-full mb-2"></div>
                    <div className="bg-muted rounded h-4 w-5/6"></div>
                  </CardContent>
                </Card>
              ))
            ) : filteredServices.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h3 className="text-xl font-medium mb-2">No services found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'Try a different search term' : 'Create your first service to get started'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setServiceFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Service
                  </Button>
                )}
              </div>
            ) : (
              filteredServices.map((service: BookingService) => (
                <Card key={service.id} className="overflow-hidden">
                  <div className="h-2" style={{ backgroundColor: service.color }}></div>
                  <CardHeader className="p-4 pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                        <div className="flex items-center mt-1">
                          <Badge variant={service.isActive ? 'outline' : 'secondary'}>
                            {service.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <HoverCard>
                            <HoverCardTrigger>
                              <Clock className="h-4 w-4 ml-2 text-muted-foreground" />
                            </HoverCardTrigger>
                            <HoverCardContent side="top">
                              <div className="text-sm">
                                <p className="font-medium">Timing Details</p>
                                <ul className="mt-1 space-y-1">
                                  <li className="flex items-center gap-1">
                                    <span className="text-muted-foreground">Duration:</span>
                                    <span>{formatDuration(service.duration)}</span>
                                  </li>
                                  {service.bufferTimeBefore > 0 && (
                                    <li className="flex items-center gap-1">
                                      <span className="text-muted-foreground">Buffer before:</span>
                                      <span>{formatDuration(service.bufferTimeBefore)}</span>
                                    </li>
                                  )}
                                  {service.bufferTimeAfter > 0 && (
                                    <li className="flex items-center gap-1">
                                      <span className="text-muted-foreground">Buffer after:</span>
                                      <span>{formatDuration(service.bufferTimeAfter)}</span>
                                    </li>
                                  )}
                                  <li className="flex items-center gap-1">
                                    <span className="text-muted-foreground">Total time:</span>
                                    <span>{formatDuration(service.duration + service.bufferTimeBefore + service.bufferTimeAfter)}</span>
                                  </li>
                                </ul>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {service.description || 'No description provided'}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span className="font-medium">
                          {service.price ? `$${(service.price / 100).toFixed(2)}` : 'Free'}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>Max {service.maxAttendees} {service.maxAttendees === 1 ? 'person' : 'people'}</span>
                      </div>
                    </div>
                    
                    {service.appointmentsCount !== undefined && (
                      <div className="mt-3 text-xs text-muted-foreground">
                        {service.appointmentsCount} appointments booked
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="availability" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Weekly availability */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Your Weekly Availability</CardTitle>
                <CardDescription>Define which days and times you're available for bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {availability.map((day, index) => (
                    <div key={index} className="rounded-md border p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`day-${index}`}
                            checked={day.isAvailable}
                            onCheckedChange={(checked) => {
                              const newAvailability = [...availability];
                              newAvailability[index].isAvailable = checked;
                              setAvailability(newAvailability);
                            }}
                          />
                          <Label htmlFor={`day-${index}`} className="font-medium">
                            {getDayName(day.dayOfWeek)}
                          </Label>
                        </div>
                        <Badge variant={day.isAvailable ? 'default' : 'secondary'}>
                          {day.isAvailable ? 'Available' : 'Unavailable'}
                        </Badge>
                      </div>
                      
                      {day.isAvailable && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor={`start-time-${index}`}>Start Time</Label>
                            <Input
                              id={`start-time-${index}`}
                              type="time"
                              value={day.startTime}
                              onChange={(e) => {
                                const newAvailability = [...availability];
                                newAvailability[index].startTime = e.target.value;
                                setAvailability(newAvailability);
                              }}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor={`end-time-${index}`}>End Time</Label>
                            <Input
                              id={`end-time-${index}`}
                              type="time"
                              value={day.endTime}
                              onChange={(e) => {
                                const newAvailability = [...availability];
                                newAvailability[index].endTime = e.target.value;
                                setAvailability(newAvailability);
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <Button className="w-full">
                    Save Availability
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Blackout dates */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Blackout Dates</CardTitle>
                    <CardDescription>Block days when you're unavailable</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Blackout Date</DialogTitle>
                        <DialogDescription>
                          Mark dates as unavailable for appointments.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateBlackoutDate} className="space-y-4">
                        <div className="grid gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="startDate">Start Date</Label>
                              <Input
                                id="startDate"
                                type="date"
                                value={newBlackoutDate.startDate}
                                onChange={(e) => setNewBlackoutDate({ ...newBlackoutDate, startDate: e.target.value })}
                                required
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="endDate">End Date</Label>
                              <Input
                                id="endDate"
                                type="date"
                                value={newBlackoutDate.endDate}
                                onChange={(e) => setNewBlackoutDate({ ...newBlackoutDate, endDate: e.target.value })}
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="reason">Reason (Optional)</Label>
                            <Input
                              id="reason"
                              placeholder="e.g., Holiday, Vacation, etc."
                              value={newBlackoutDate.reason}
                              onChange={(e) => setNewBlackoutDate({ ...newBlackoutDate, reason: e.target.value })}
                            />
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button type="submit">
                            Add Blackout Date
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingBlackoutDates ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : blackoutDates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarOff className="mx-auto h-12 w-12 mb-2 opacity-20" />
                    <p>No blackout dates set</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {blackoutDates.map((blackout: BookingBlackoutDate) => {
                      const startDate = new Date(blackout.startDate);
                      const endDate = new Date(blackout.endDate);
                      const isSameDay = startDate.toDateString() === endDate.toDateString();
                      
                      return (
                        <div 
                          key={blackout.id} 
                          className="flex justify-between items-center p-3 border rounded-md"
                        >
                          <div>
                            <div className="flex items-center">
                              <CalendarOff className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span className="font-medium">
                                {isSameDay ? (
                                  startDate.toLocaleDateString()
                                ) : (
                                  `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
                                )}
                              </span>
                            </div>
                            {blackout.reason && (
                              <p className="text-xs text-muted-foreground mt-1 ml-6">
                                {blackout.reason}
                              </p>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deleteBlackoutDateMutation.mutate(blackout.id)}
                            disabled={deleteBlackoutDateMutation.isPending}
                          >
                            <Trash className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}