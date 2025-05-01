import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Briefcase, 
  Search, 
  Plus, 
  FileText, 
  Users, 
  MapPin, 
  Calendar, 
  Clock, 
  MoreVertical, 
  Edit, 
  Trash, 
  Eye, 
  DollarSign,
  Building,
  CheckCircle2,
  XCircle,
  HourglassIcon
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Types for job listings
type JobListing = {
  id: number;
  userId: number;
  title: string;
  company: string;
  location: string;
  isRemote: boolean;
  type: 'full_time' | 'part_time' | 'contract' | 'internship';
  description: string;
  requirements?: string;
  responsibilities?: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
    period: 'hourly' | 'monthly' | 'yearly';
  };
  status: 'active' | 'filled' | 'expired';
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  applicationCount?: number;
};

type JobApplication = {
  id: number;
  jobId: number;
  userId: number;
  coverLetter?: string;
  resumeUrl?: string;
  status: 'submitted' | 'reviewed' | 'interview' | 'rejected' | 'accepted';
  createdAt: string;
  updatedAt: string;
  job?: JobListing;
  applicant?: {
    id: number;
    username: string;
    fullName?: string;
    email: string;
  };
};

export default function JobsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('listings');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [jobFormOpen, setJobFormOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [newJob, setNewJob] = useState<{
    title: string;
    company: string;
    location: string;
    isRemote: boolean;
    type: string;
    description: string;
    requirements: string;
    responsibilities: string;
    salaryMin: string;
    salaryMax: string;
    salaryCurrency: string;
    salaryPeriod: string;
  }>({
    title: '',
    company: '',
    location: '',
    isRemote: false,
    type: 'full_time',
    description: '',
    requirements: '',
    responsibilities: '',
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'USD',
    salaryPeriod: 'yearly',
  });

  // Fetch job listings
  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: ['/api/jobs/listings'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/jobs/listings');
      const json = await res.json();
      return json.data?.listings || [];
    },
  });

  // Fetch job applications
  const { data: applications = [], isLoading: isLoadingApplications } = useQuery({
    queryKey: ['/api/jobs/applications'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/jobs/applications');
      const json = await res.json();
      return json.data?.applications || [];
    },
  });

  // Fetch job details if selected
  const { data: jobDetails, isLoading: isLoadingJobDetails } = useQuery({
    queryKey: ['/api/jobs/listings', selectedJob],
    queryFn: async () => {
      if (!selectedJob) return null;
      const res = await apiRequest('GET', `/api/jobs/listings/${selectedJob}`);
      const json = await res.json();
      return json.data?.listing || null;
    },
    enabled: !!selectedJob,
  });

  // Create a new job listing
  const createJobMutation = useMutation({
    mutationFn: async (jobData: any) => {
      const res = await apiRequest('POST', '/api/jobs/listings', jobData);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/listings'] });
      setJobFormOpen(false);
      setNewJob({
        title: '',
        company: '',
        location: '',
        isRemote: false,
        type: 'full_time',
        description: '',
        requirements: '',
        responsibilities: '',
        salaryMin: '',
        salaryMax: '',
        salaryCurrency: 'USD',
        salaryPeriod: 'yearly',
      });
      toast({
        title: 'Success',
        description: 'Job listing created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create job listing: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete a job listing
  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const res = await apiRequest('DELETE', `/api/jobs/listings/${jobId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/listings'] });
      if (selectedJob) {
        setSelectedJob(null);
      }
      toast({
        title: 'Success',
        description: 'Job listing deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete job listing: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update application status
  const updateApplicationStatusMutation = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: number, status: string }) => {
      const res = await apiRequest('PATCH', `/api/jobs/applications/${applicationId}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/applications'] });
      toast({
        title: 'Success',
        description: 'Application status updated',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update application status: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    
    const salaryMin = newJob.salaryMin ? parseInt(newJob.salaryMin) : undefined;
    const salaryMax = newJob.salaryMax ? parseInt(newJob.salaryMax) : undefined;
    
    const salary = salaryMin || salaryMax 
      ? {
          min: salaryMin,
          max: salaryMax,
          currency: newJob.salaryCurrency,
          period: newJob.salaryPeriod,
        }
      : undefined;

    const jobData = {
      title: newJob.title,
      company: newJob.company,
      location: newJob.location,
      isRemote: newJob.isRemote,
      type: newJob.type,
      description: newJob.description,
      requirements: newJob.requirements,
      responsibilities: newJob.responsibilities,
      salary,
    };
    
    createJobMutation.mutate(jobData);
  };

  const filteredJobs = jobs.filter((job: JobListing) => {
    let matches = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 job.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterType && filterType !== 'all') {
      matches = matches && job.type === filterType;
    }
    
    if (filterStatus && filterStatus !== 'all') {
      matches = matches && job.status === filterStatus;
    }
    
    return matches;
  });

  const filteredApplications = applications.filter((application: JobApplication) => {
    return application.job?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           application.job?.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
           application.applicant?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
           application.applicant?.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Helper function to render salary information
  const formatSalary = (salary: JobListing['salary']) => {
    if (!salary) return 'Not specified';
    
    const currency = salary.currency === 'USD' ? '$' : salary.currency;
    
    if (salary.min && salary.max) {
      return `${currency}${salary.min.toLocaleString()} - ${currency}${salary.max.toLocaleString()} per ${salary.period.replace('ly', '')}`;
    } else if (salary.min) {
      return `${currency}${salary.min.toLocaleString()}+ per ${salary.period.replace('ly', '')}`;
    } else if (salary.max) {
      return `Up to ${currency}${salary.max.toLocaleString()} per ${salary.period.replace('ly', '')}`;
    }
    
    return 'Not specified';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Job Listings</h2>
          <p className="text-muted-foreground">
            Manage job postings and applications in one place.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="listings">Job Listings</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search job listings..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Select
                  value={filterType || 'all'}
                  onValueChange={setFilterType}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="full_time">Full-time</SelectItem>
                    <SelectItem value="part_time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filterStatus || 'all'}
                  onValueChange={setFilterStatus}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="filled">Filled</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={() => setJobFormOpen(!jobFormOpen)}>
              <Plus className="h-4 w-4 mr-2" />
              {jobFormOpen ? 'Cancel' : 'Post Job'}
            </Button>
          </div>

          {jobFormOpen && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Post New Job</CardTitle>
                <CardDescription>Create a job listing to attract top talent</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateJob} className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <label htmlFor="title" className="text-sm font-medium">Job Title</label>
                      <Input
                        id="title"
                        placeholder="e.g., Senior Software Engineer"
                        value={newJob.title}
                        onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <label htmlFor="company" className="text-sm font-medium">Company Name</label>
                      <Input
                        id="company"
                        placeholder="Your company name"
                        value={newJob.company}
                        onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <label htmlFor="location" className="text-sm font-medium">Location</label>
                        <Input
                          id="location"
                          placeholder="e.g., New York, NY"
                          value={newJob.location}
                          onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                          required
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <label htmlFor="type" className="text-sm font-medium">Job Type</label>
                        <Select
                          value={newJob.type}
                          onValueChange={(value) => setNewJob({ ...newJob, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select job type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full_time">Full-time</SelectItem>
                            <SelectItem value="part_time">Part-time</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="internship">Internship</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isRemote"
                        checked={newJob.isRemote}
                        onCheckedChange={(checked) => setNewJob({ ...newJob, isRemote: checked })}
                      />
                      <Label htmlFor="isRemote">Remote position</Label>
                    </div>
                    
                    <div className="grid gap-2">
                      <label htmlFor="description" className="text-sm font-medium">Job Description</label>
                      <Textarea
                        id="description"
                        placeholder="Describe the job position in detail"
                        value={newJob.description}
                        onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                        required
                        className="min-h-[100px]"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <label htmlFor="requirements" className="text-sm font-medium">Requirements</label>
                      <Textarea
                        id="requirements"
                        placeholder="List job requirements (education, experience, skills)"
                        value={newJob.requirements}
                        onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
                        className="min-h-[80px]"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <label htmlFor="responsibilities" className="text-sm font-medium">Responsibilities</label>
                      <Textarea
                        id="responsibilities"
                        placeholder="List key job responsibilities"
                        value={newJob.responsibilities}
                        onChange={(e) => setNewJob({ ...newJob, responsibilities: e.target.value })}
                        className="min-h-[80px]"
                      />
                    </div>
                    
                    <div className="grid gap-4">
                      <h3 className="font-medium text-sm">Salary Information (Optional)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <label htmlFor="salaryMin" className="text-sm font-medium">Minimum Salary</label>
                          <Input
                            id="salaryMin"
                            type="number"
                            placeholder="e.g., 50000"
                            value={newJob.salaryMin}
                            onChange={(e) => setNewJob({ ...newJob, salaryMin: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <label htmlFor="salaryMax" className="text-sm font-medium">Maximum Salary</label>
                          <Input
                            id="salaryMax"
                            type="number"
                            placeholder="e.g., 80000"
                            value={newJob.salaryMax}
                            onChange={(e) => setNewJob({ ...newJob, salaryMax: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <label htmlFor="salaryCurrency" className="text-sm font-medium">Currency</label>
                          <Select
                            value={newJob.salaryCurrency}
                            onValueChange={(value) => setNewJob({ ...newJob, salaryCurrency: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD ($)</SelectItem>
                              <SelectItem value="EUR">EUR (€)</SelectItem>
                              <SelectItem value="GBP">GBP (£)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <label htmlFor="salaryPeriod" className="text-sm font-medium">Pay Period</label>
                          <Select
                            value={newJob.salaryPeriod}
                            onValueChange={(value) => setNewJob({ ...newJob, salaryPeriod: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select pay period" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hourly">Hourly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createJobMutation.isPending}
                  >
                    {createJobMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Post Job
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {isLoadingJobs ? (
              Array(4).fill(0).map((_, index) => (
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
            ) : filteredJobs.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h3 className="text-xl font-medium mb-2">No job listings found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || filterType || filterStatus ? 'Try different search criteria' : 'Post your first job to get started'}
                </p>
                {!searchQuery && !filterType && !filterStatus && (
                  <Button onClick={() => setJobFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Post Job
                  </Button>
                )}
              </div>
            ) : (
              filteredJobs.map((job: JobListing) => (
                <Card key={job.id} className="overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg line-clamp-1">{job.title}</CardTitle>
                        <CardDescription className="flex items-center">
                          <Building className="h-3 w-3 mr-1" />
                          {job.company}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={
                          job.status === 'active' 
                            ? 'default' 
                            : job.status === 'filled' 
                              ? 'secondary' 
                              : 'outline'
                        }
                      >
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3">
                    <div className="flex flex-wrap gap-2 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{job.location}</span>
                        {job.isRemote && <Badge variant="outline" className="ml-2">Remote</Badge>}
                      </div>
                      
                      <Badge variant="secondary" className="capitalize">
                        {job.type.replace('_', '-')}
                      </Badge>
                    </div>
                    
                    <p className="text-sm line-clamp-2">
                      {job.description}
                    </p>
                    
                    <div className="flex items-center text-sm text-muted-foreground mt-2">
                      <DollarSign className="h-3 w-3 mr-1" />
                      <span>{formatSalary(job.salary)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm mt-2">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      {job.applicationCount !== undefined && (
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{job.applicationCount} applicants</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <Separator />
                  <CardFooter className="p-4 flex justify-between">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedJob(job.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setSelectedJob(job.id)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            deleteJobMutation.mutate(job.id);
                          }}
                          className="text-destructive"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative w-80">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search applications..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead>
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium">Applicant</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Job</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Applied</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingApplications ? (
                    Array(5).fill(0).map((_, index) => (
                      <tr key={index} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle">
                          <div className="bg-muted rounded h-4 w-24"></div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="bg-muted rounded h-4 w-32"></div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="bg-muted rounded h-4 w-20"></div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="bg-muted rounded h-4 w-16"></div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="bg-muted rounded h-8 w-8"></div>
                        </td>
                      </tr>
                    ))
                  ) : filteredApplications.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <FileText className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
                          <p className="text-lg font-medium mb-2">No applications found</p>
                          <p className="text-muted-foreground">
                            {searchQuery ? 'Try a different search term' : 'No one has applied to your job listings yet'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredApplications.map((application: JobApplication) => (
                      <tr key={application.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarFallback>
                                {application.applicant?.username?.[0] || 'A'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{application.applicant?.fullName || application.applicant?.username}</div>
                              <div className="text-xs text-muted-foreground">{application.applicant?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div>
                            <div className="font-medium">{application.job?.title}</div>
                            <div className="text-xs text-muted-foreground">{application.job?.company}</div>
                          </div>
                        </td>
                        <td className="p-4 align-middle text-muted-foreground">
                          {new Date(application.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 align-middle">
                          <Badge 
                            variant={
                              application.status === 'accepted' 
                                ? 'default' 
                                : application.status === 'rejected' 
                                  ? 'destructive' 
                                  : application.status === 'interview'
                                    ? 'secondary'
                                    : 'outline'
                            }
                          >
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
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
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Application
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => updateApplicationStatusMutation.mutate({ 
                                  applicationId: application.id, 
                                  status: 'reviewed' 
                                })}
                                disabled={application.status === 'reviewed'}
                              >
                                <HourglassIcon className="h-4 w-4 mr-2" />
                                Mark as Reviewed
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateApplicationStatusMutation.mutate({ 
                                  applicationId: application.id, 
                                  status: 'interview' 
                                })}
                                disabled={application.status === 'interview'}
                              >
                                <Calendar className="h-4 w-4 mr-2" />
                                Schedule Interview
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateApplicationStatusMutation.mutate({ 
                                  applicationId: application.id, 
                                  status: 'accepted' 
                                })}
                                disabled={application.status === 'accepted'}
                                className="text-green-600"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Accept Application
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateApplicationStatusMutation.mutate({ 
                                  applicationId: application.id, 
                                  status: 'rejected' 
                                })}
                                disabled={application.status === 'rejected'}
                                className="text-destructive"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject Application
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}