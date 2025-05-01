import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Book, GraduationCap, Plus, Clock, Users, Star, BarChart4, Search, ChevronDown, MoreVertical, Edit, Trash } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Types for education components
type Course = {
  id: number;
  title: string;
  description: string;
  shortDescription: string;
  coverImage: string;
  price: number;
  status: 'draft' | 'published' | 'archived';
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  enrollments: number;
  rating: number;
  createdAt: string;
  allowKids: boolean;
  parentalControlLevel: 'low' | 'medium' | 'high';
};

type Module = {
  id: number;
  courseId: number;
  title: string;
  description: string;
  order: number;
  lessonsCount?: number;
};

type Enrollment = {
  id: number;
  courseId: number;
  userId: number;
  progress: number;
  status: 'active' | 'completed' | 'abandoned';
  enrollmentDate: string;
  completionDate: string | null;
  course?: Course;
  student?: {
    id: number;
    username: string;
    fullName: string;
    email: string;
  };
};

export default function EducationPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('courses');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [courseFormOpen, setCourseFormOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [newCourse, setNewCourse] = useState<{
    title: string;
    description: string;
    shortDescription: string;
    level: string;
    price: string;
    allowKids: boolean;
    parentalControlLevel: string;
  }>({
    title: '',
    description: '',
    shortDescription: '',
    level: 'beginner',
    price: '',
    allowKids: false,
    parentalControlLevel: 'low',
  });

  // Fetch courses
  const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ['/api/education/courses'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/education/courses');
      const json = await res.json();
      return json.data?.courses || [];
    },
  });

  // Fetch enrollments
  const { data: enrollments = [], isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ['/api/education/enrollments'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/education/enrollments');
      const json = await res.json();
      return json.data?.enrollments || [];
    },
  });

  // Fetch course details if a course is selected
  const { data: courseDetails, isLoading: isLoadingCourseDetails } = useQuery({
    queryKey: ['/api/education/courses', selectedCourse],
    queryFn: async () => {
      if (!selectedCourse) return null;
      const res = await apiRequest('GET', `/api/education/courses/${selectedCourse}`);
      const json = await res.json();
      return json.data?.course || null;
    },
    enabled: !!selectedCourse,
  });

  // Create a new course
  const createCourseMutation = useMutation({
    mutationFn: async (courseData: any) => {
      const res = await apiRequest('POST', '/api/education/courses', courseData);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/education/courses'] });
      setCourseFormOpen(false);
      setNewCourse({
        title: '',
        description: '',
        shortDescription: '',
        level: 'beginner',
        price: '',
        allowKids: false,
        parentalControlLevel: 'low',
      });
      toast({
        title: 'Success',
        description: 'Course created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create course: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete a course
  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const res = await apiRequest('DELETE', `/api/education/courses/${courseId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/education/courses'] });
      if (selectedCourse) {
        setSelectedCourse(null);
      }
      toast({
        title: 'Success',
        description: 'Course deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete course: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    const courseData = {
      ...newCourse,
      price: newCourse.price ? parseInt(newCourse.price) * 100 : 0, // Convert to cents
    };
    createCourseMutation.mutate(courseData);
  };

  const filteredCourses = courses.filter((course: Course) => {
    let matches = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterLevel && filterLevel !== 'all') {
      matches = matches && course.level === filterLevel;
    }
    
    if (filterStatus && filterStatus !== 'all') {
      matches = matches && course.status === filterStatus;
    }
    
    return matches;
  });

  const filteredEnrollments = enrollments.filter((enrollment: Enrollment) => {
    return enrollment.course?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           enrollment.student?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
           enrollment.student?.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Educational Portal</h2>
          <p className="text-muted-foreground">
            Manage your courses, students, and learning content with parental controls.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Select
                  value={filterLevel || 'all'}
                  onValueChange={setFilterLevel}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
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
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={() => setCourseFormOpen(!courseFormOpen)}>
              <Plus className="h-4 w-4 mr-2" />
              {courseFormOpen ? 'Cancel' : 'Create Course'}
            </Button>
          </div>

          {courseFormOpen && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Create New Course</CardTitle>
                <CardDescription>Create an educational course with parental controls</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCourse} className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <label htmlFor="title" className="text-sm font-medium">Course Title</label>
                      <Input
                        id="title"
                        placeholder="e.g., Introduction to Programming"
                        value={newCourse.title}
                        onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <label htmlFor="shortDescription" className="text-sm font-medium">Short Description</label>
                      <Input
                        id="shortDescription"
                        placeholder="Brief description (1-2 sentences)"
                        value={newCourse.shortDescription}
                        onChange={(e) => setNewCourse({ ...newCourse, shortDescription: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <label htmlFor="description" className="text-sm font-medium">Full Description</label>
                      <Textarea
                        id="description"
                        placeholder="Detailed description of the course"
                        value={newCourse.description}
                        onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                        required
                        className="min-h-[100px]"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <label htmlFor="level" className="text-sm font-medium">Course Level</label>
                        <Select
                          value={newCourse.level}
                          onValueChange={(value) => setNewCourse({ ...newCourse, level: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid gap-2">
                        <label htmlFor="price" className="text-sm font-medium">Price (USD)</label>
                        <Input
                          id="price"
                          type="number"
                          placeholder="e.g., 49.99 (leave empty for free)"
                          value={newCourse.price}
                          onChange={(e) => setNewCourse({ ...newCourse, price: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-4 pt-4">
                      <h3 className="font-medium text-sm">Parental Controls</h3>
                      <div className="flex items-center justify-between border p-4 rounded-md">
                        <div className="space-y-0.5">
                          <label htmlFor="allowKids" className="font-medium">
                            Allow Children Access
                          </label>
                          <p className="text-sm text-muted-foreground">
                            Enable for content suitable for children
                          </p>
                        </div>
                        <Switch
                          id="allowKids"
                          checked={newCourse.allowKids}
                          onCheckedChange={(checked) => setNewCourse({ ...newCourse, allowKids: checked })}
                        />
                      </div>
                      
                      {newCourse.allowKids && (
                        <div className="grid gap-2">
                          <label htmlFor="parentalControlLevel" className="text-sm font-medium">
                            Parental Control Level
                          </label>
                          <Select
                            value={newCourse.parentalControlLevel}
                            onValueChange={(value) => setNewCourse({ ...newCourse, parentalControlLevel: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low - Minimal restrictions</SelectItem>
                              <SelectItem value="medium">Medium - Some content filtering</SelectItem>
                              <SelectItem value="high">High - Maximum protection</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">
                            Higher levels enable stricter content filtering and require parental approval
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createCourseMutation.isPending}
                  >
                    {createCourseMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Create Course
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingCourses ? (
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
            ) : filteredCourses.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <GraduationCap className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h3 className="text-xl font-medium mb-2">No courses found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || filterLevel || filterStatus ? 'Try different search criteria' : 'Create your first course to get started'}
                </p>
                {!searchQuery && !filterLevel && !filterStatus && (
                  <Button onClick={() => setCourseFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Course
                  </Button>
                )}
              </div>
            ) : (
              filteredCourses.map((course: Course) => (
                <Card key={course.id} className="overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg line-clamp-1">{course.title}</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <Badge variant={course.status === 'published' ? 'default' : (course.status === 'draft' ? 'outline' : 'secondary')}>
                            {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                          </Badge>
                          {course.allowKids && (
                            <Badge variant="outline" className="ml-2">
                              Kids
                            </Badge>
                          )}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setSelectedCourse(course.id)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              deleteCourseMutation.mutate(course.id);
                            }}
                            className="text-destructive"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Badge variant="secondary" className="capitalize">
                        {course.level}
                      </Badge>
                      {course.duration && (
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{Math.floor(course.duration / 60)}h {course.duration % 60}m</span>
                        </div>
                      )}
                      {course.price !== undefined && (
                        <div className="ml-auto font-medium text-foreground">
                          {course.price ? `$${(course.price/100).toFixed(2)}` : 'Free'}
                        </div>
                      )}
                    </div>
                    <p className="text-sm line-clamp-2 mb-3">
                      {course.shortDescription || course.description}
                    </p>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{course.enrollments || 0} students</span>
                      </div>
                      {course.rating && (
                        <div className="flex items-center">
                          <Star className="h-4 w-4 mr-1 text-yellow-400" />
                          <span>{course.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <Separator />
                  <CardFooter className="p-4">
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => setSelectedCourse(course.id)}
                    >
                      Manage Course
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="enrollments" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative w-80">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search enrollments..."
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
                    <th className="h-12 px-4 text-left align-middle font-medium">Student</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Course</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Enrolled</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Progress</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingEnrollments ? (
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
                          <div className="bg-muted rounded h-4 w-full"></div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="bg-muted rounded h-4 w-16"></div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="bg-muted rounded h-8 w-8"></div>
                        </td>
                      </tr>
                    ))
                  ) : filteredEnrollments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Users className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
                          <p className="text-lg font-medium mb-2">No enrollments found</p>
                          <p className="text-muted-foreground">
                            {searchQuery ? 'Try a different search term' : 'No students have enrolled in courses yet'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredEnrollments.map((enrollment: Enrollment) => (
                      <tr key={enrollment.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarFallback>
                                {enrollment.student?.username?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{enrollment.student?.fullName || enrollment.student?.username}</div>
                              <div className="text-xs text-muted-foreground">{enrollment.student?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle font-medium">{enrollment.course?.title}</td>
                        <td className="p-4 align-middle text-muted-foreground">
                          {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-2">
                            <Progress value={enrollment.progress} className="h-2" />
                            <span className="text-xs font-medium">{enrollment.progress}%</span>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <Badge 
                            variant={
                              enrollment.status === 'completed' 
                                ? 'default' 
                                : enrollment.status === 'active' 
                                  ? 'outline' 
                                  : 'secondary'
                            }
                          >
                            {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
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
                                <BarChart4 className="h-4 w-4 mr-2" />
                                View Progress
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash className="h-4 w-4 mr-2" />
                                Unenroll
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