
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { JobPost, User, CreateJobPostInput, CreateJobApplicationInput, LoginInput, CreateUserInput, UpdateJobPostInput } from '../../server/src/schema';

function App() {
  // State management
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showJobDetail, setShowJobDetail] = useState(false);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showAddJobDialog, setShowAddJobDialog] = useState(false);
  const [showEditJobDialog, setShowEditJobDialog] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [editingJob, setEditingJob] = useState<JobPost | null>(null);

  // Form states
  const [authForm, setAuthForm] = useState<LoginInput & { company_name?: string }>({
    email: '',
    password: '',
    company_name: ''
  });

  const [applicationForm, setApplicationForm] = useState<CreateJobApplicationInput>({
    job_post_id: 0,
    applicant_name: '',
    applicant_email: '',
    short_answer: ''
  });

  const [jobForm, setJobForm] = useState<CreateJobPostInput>({
    title: '',
    company_name: '',
    description: '',
    location: '',
    job_type: 'full-time',
    tags: [],
    employer_id: 0
  });

  const [tagInput, setTagInput] = useState('');

  // Load job posts
  const loadJobPosts = useCallback(async () => {
    try {
      const result = await trpc.getJobPosts.query();
      setJobPosts(result);
    } catch (error) {
      console.error('Failed to load job posts:', error);
    }
  }, []);

  useEffect(() => {
    loadJobPosts();
  }, [loadJobPosts]);

  // Authentication handlers
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isLogin) {
        const result = await trpc.loginUser.mutate({
          email: authForm.email,
          password: authForm.password
        });
        if (result) {
          setUser(result);
          setShowAuthDialog(false);
          // Load employer's job posts
          const employerJobs = await trpc.getEmployerJobPosts.query(result.id);
          setJobPosts(employerJobs);
        } else {
          alert('Invalid credentials');
        }
      } else {
        const createUserInput: CreateUserInput = {
          email: authForm.email,
          password: authForm.password,
          company_name: authForm.company_name || ''
        };
        const result = await trpc.createUser.mutate(createUserInput);
        if (result) {
          setUser(result);
          setShowAuthDialog(false);
        }
      }
      setAuthForm({ email: '', password: '', company_name: '' });
    } catch (error) {
      console.error('Authentication failed:', error);
      alert('Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedJob(null);
    setShowJobDetail(false);
    loadJobPosts(); // Reload all jobs
  };

  // Job detail handler
  const handleViewJob = async (jobId: number) => {
    try {
      const job = await trpc.getJobPost.query({ id: jobId });
      if (job) {
        setSelectedJob(job);
        setShowJobDetail(true);
      }
    } catch (error) {
      console.error('Failed to load job details:', error);
    }
  };

  // Job application handler
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    setIsLoading(true);
    try {
      const applicationData: CreateJobApplicationInput = {
        ...applicationForm,
        job_post_id: selectedJob.id
      };
      await trpc.createJobApplication.mutate(applicationData);
      alert('Application submitted successfully! 🎉');
      setShowApplyDialog(false);
      setApplicationForm({
        job_post_id: 0,
        applicant_name: '',
        applicant_email: '',
        short_answer: ''
      });
    } catch (error) {
      console.error('Failed to submit application:', error);
      alert('Failed to submit application');
    } finally {
      setIsLoading(false);
    }
  };

  // Job management handlers
  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      const jobData: CreateJobPostInput = {
        ...jobForm,
        employer_id: user.id,
        company_name: user.company_name
      };
      const newJob = await trpc.createJobPost.mutate(jobData);
      setJobPosts((prev: JobPost[]) => [newJob, ...prev]);
      setShowAddJobDialog(false);
      resetJobForm();
    } catch (error) {
      console.error('Failed to create job post:', error);
      alert('Failed to create job post');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    setIsLoading(true);
    try {
      const updateData: UpdateJobPostInput = {
        id: editingJob.id,
        title: jobForm.title,
        description: jobForm.description,
        location: jobForm.location,
        job_type: jobForm.job_type,
        tags: jobForm.tags
      };
      const updatedJob = await trpc.updateJobPost.mutate(updateData);
      if (updatedJob) {
        setJobPosts((prev: JobPost[]) => 
          prev.map((job: JobPost) => job.id === editingJob.id ? updatedJob : job)
        );
        // Update selectedJob if it's the one being edited
        if (selectedJob?.id === editingJob.id) {
          setSelectedJob(updatedJob);
        }
      } else {
        alert('Failed to update job post');
      }
      setShowEditJobDialog(false);
      setEditingJob(null);
      resetJobForm();
    } catch (error) {
      console.error('Failed to update job post:', error);
      alert('Failed to update job post');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!user) return;

    try {
      await trpc.deleteJobPost.mutate({
        id: jobId,
        employer_id: user.id
      });
      setJobPosts((prev: JobPost[]) => prev.filter((job: JobPost) => job.id !== jobId));
      if (selectedJob?.id === jobId) {
        setSelectedJob(null);
        setShowJobDetail(false);
      }
    } catch (error) {
      console.error('Failed to delete job post:', error);
      alert('Failed to delete job post');
    }
  };

  const resetJobForm = () => {
    setJobForm({
      title: '',
      company_name: '',
      description: '',
      location: '',
      job_type: 'full-time',
      tags: [],
      employer_id: 0
    });
    setTagInput('');
  };

  const openEditDialog = (job: JobPost) => {
    setEditingJob(job);
    setJobForm({
      title: job.title,
      company_name: job.company_name,
      description: job.description,
      location: job.location,
      job_type: job.job_type,
      tags: job.tags,
      employer_id: job.employer_id
    });
    setShowEditJobDialog(true);
  };

  const addTag = () => {
    if (tagInput.trim() && !jobForm.tags.includes(tagInput.trim())) {
      setJobForm((prev: CreateJobPostInput) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setJobForm((prev: CreateJobPostInput) => ({
      ...prev,
      tags: prev.tags.filter((tag: string) => tag !== tagToRemove)
    }));
  };

  const truncateDescription = (text: string, maxLength: number = 150) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900">🤖 AI Jobs Board</h1>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                AI Engineering
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Welcome, <span className="font-medium">{user.company_name}</span>
                  </span>
                  <Dialog open={showAddJobDialog} onOpenChange={setShowAddJobDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        ➕ Post Job
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>➕ Post New Job</DialogTitle>
                        <DialogDescription>
                          Create a new job listing to attract top AI talent
                        </DialogDescription>
                      </DialogHeader>
                      
                      <form onSubmit={handleAddJob} className="space-y-4">
                        <div>
                          <Label htmlFor="job_title">Job Title</Label>
                          <Input
                            id="job_title"
                            value={jobForm.title}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setJobForm((prev: CreateJobPostInput) => ({ ...prev, title: e.target.value }))
                            }
                            placeholder="e.g. Senior AI Engineer"
                            required
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="location">Location</Label>
                            <Input
                              id="location"
                              value={jobForm.location}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setJobForm((prev: CreateJobPostInput) => ({ ...prev, location: e.target.value }))
                              }
                              placeholder="e.g. San Francisco, CA"
                              required
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="job_type">Job Type</Label>
                            <Select
                              value={jobForm.job_type}
                              onValueChange={(value: 'full-time' | 'part-time' | 'contract' | 'remote') =>
                                setJobForm((prev: CreateJobPostInput) => ({ ...prev, job_type: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="full-time">Full-time</SelectItem>
                                <SelectItem value="part-time">Part-time</SelectItem>
                                <SelectItem value="contract">Contract</SelectItem>
                                <SelectItem value="remote">Remote</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="description">Job Description</Label>
                          <Textarea
                            id="description"
                            value={jobForm.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                              setJobForm((prev: CreateJobPostInput) => ({ ...prev, description: e.target.value }))
                            }
                            placeholder="Describe the role, responsibilities, and requirements..."
                            rows={6}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label>Skills & Technologies</Label>
                          <div className="flex space-x-2 mb-2">
                            <Input
                              value={tagInput}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
                              placeholder="Add a skill (e.g. Python, TensorFlow)"
                              onKeyPress={(e: React.KeyboardEvent) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addTag();
                                }
                              }}
                            />
                            <Button type="button" onClick={addTag} variant="outline">
                              Add
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {jobForm.tags.map((tag: string, index: number) => (
                              <Badge key={index} variant="secondary" className="cursor-pointer">
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => removeTag(tag)}
                                  className="ml-1 text-red-500 hover:text-red-700"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? 'Creating...' : 'Post Job'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              ) : (
                <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      🔑 Employer Login
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {isLogin ? '🔑 Employer Login' : '✨ Create Account'}
                      </DialogTitle>
                      <DialogDescription>
                        {isLogin 
                          ? 'Sign in to manage your job postings' 
                          : 'Create an account to start posting jobs'
                        }
                      </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleAuth} className="space-y-4">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={authForm.email}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setAuthForm((prev) => ({ ...prev, email: e.target.value }))
                          }
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={authForm.password}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setAuthForm((prev) => ({ ...prev, password: e.target.value }))
                          }
                          required
                        />
                      </div>
                      
                      {!isLogin && (
                        <div>
                          <Label htmlFor="company_name">Company Name</Label>
                          <Input
                            id="company_name"
                            value={authForm.company_name || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setAuthForm((prev) => ({ ...prev, company_name: e.target.value }))
                            }
                            required
                          />
                        </div>
                      )}
                      
                      <DialogFooter className="flex-col space-y-2">
                        <Button type="submit" disabled={isLoading} className="w-full">
                          {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                        </Button>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          onClick={() => setIsLogin(!isLogin)}
                          className="w-full"
                        >
                          {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {showJobDetail && selectedJob ? (
          // Job Detail View
          <div className="max-w-4xl mx-auto">
            <Button 
              variant="outline" 
              onClick={() => setShowJobDetail(false)}
              className="mb-6"
            >
              ← Back to Jobs
            </Button>
            
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl mb-2">{selectedJob.title}</CardTitle>
                    <CardDescription className="text-blue-100 text-lg">
                      {selectedJob.company_name}
                    </CardDescription>
                  </div>
                  {user && user.id === selectedJob.employer_id && (
                    <div className="flex space-x-2">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => openEditDialog(selectedJob)}
                      >
                        ✏️ Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            🗑️ Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Job Post</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this job post? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteJob(selectedJob.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">📍 Location</h3>
                    <p className="text-gray-600">{selectedJob.location}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">💼 Job Type</h3>
                    <Badge variant="outline" className="capitalize">
                      {selectedJob.job_type}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">📅 Posted</h3>
                    <p className="text-gray-600">{selectedJob.created_at.toLocaleDateString()}</p>
                  </div>
                </div>

                {selectedJob.tags.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-700 mb-3">🏷️ Skills & Technologies</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.tags.map((tag: string, index: number) => (
                        <Badge key={index} className="bg-blue-100 text-blue-800">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator className="my-6" />

                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">📝 Job Description</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedJob.description}
                    </p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="bg-gray-50 p-6">
                <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-lg py-3"
                      onClick={() => setApplicationForm((prev: CreateJobApplicationInput) => ({
                        ...prev,
                        job_post_id: selectedJob.id
                      }))}
                    >
                      🚀 Apply for this Position
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>🚀 Apply for Position</DialogTitle>
                      <DialogDescription>
                        Apply for {selectedJob?.title} at {selectedJob?.company_name}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleApply} className="space-y-4">
                      <div>
                        <Label htmlFor="applicant_name">Full Name</Label>
                        <Input
                          id="applicant_name"
                          value={applicationForm.applicant_name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setApplicationForm((prev: CreateJobApplicationInput) => ({
                              ...prev,
                              applicant_name: e.target.value
                            }))
                          }
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="applicant_email">Email</Label>
                        <Input
                          id="applicant_email"
                          type="email"
                          value={applicationForm.applicant_email}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setApplicationForm((prev: CreateJobApplicationInput) => ({
                              ...prev,
                              applicant_email: e.target.value
                            }))
                          }
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="short_answer">Why are you interested in this position?</Label>
                        <Textarea
                          id="short_answer"
                          value={applicationForm.short_answer}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setApplicationForm((prev: CreateJobApplicationInput) => ({
                              ...prev,
                              short_answer: e.target.value
                            }))
                          }
                          placeholder="Tell us why you're the perfect fit for this role..."
                          required
                        />
                      </div>
                      
                      <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="w-full">
                          {isLoading ? 'Submitting...' : 'Submit Application'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          </div>
        ) : (
          // Job Listings View
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Discover Amazing AI Engineering Opportunities
              </h2>
              <p className="text-gray-600 text-lg">
                Find your next role in artificial intelligence and machine learning
              </p>
            </div>

            {jobPosts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🤖</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No job posts yet</h3>
                <p className="text-gray-500">
                  {user ? "Create your first job posting!" : "Be the first to discover new opportunities!"}
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobPosts.map((job: JobPost) => (
                  <Card key={job.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-lg line-clamp-2">{job.title}</CardTitle>
                        {user && user.id === job.employer_id && (
                          <Badge variant="secondary" className="text-xs">
                            Your Post
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="font-medium text-blue-600">
                        {job.company_name}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {truncateDescription(job.description)}
                      </p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <span>📍 {job.location}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Badge variant="outline" className="capitalize text-xs">
                            {job.job_type}
                          </Badge>
                        </div>
                      </div>

                      {job.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {job.tags.slice(0, 3).map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {job.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{job.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                    
                    <CardFooter className="pt-0">
                      <Button 
                        onClick={() => handleViewJob(job.id)}
                        className="w-full"
                        variant="outline"
                      >
                        View Details →
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Edit Job Dialog */}
      <Dialog open={showEditJobDialog} onOpenChange={setShowEditJobDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>✏️ Edit Job Post</DialogTitle>
            <DialogDescription>
              Update your job listing details
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEditJob} className="space-y-4">
            <div>
              <Label htmlFor="edit_job_title">Job Title</Label>
              <Input
                id="edit_job_title"
                value={jobForm.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setJobForm((prev: CreateJobPostInput) => ({ ...prev, title: e.target.value }))
                }
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_location">Location</Label>
                <Input
                  id="edit_location"
                  value={jobForm.location}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setJobForm((prev: CreateJobPostInput) => ({ ...prev, location: e.target.value }))
                  }
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="edit_job_type">Job Type</Label>
                <Select
                  value={jobForm.job_type}
                  onValueChange={(value: 'full-time' | 'part-time' | 'contract' | 'remote') =>
                    setJobForm((prev: CreateJobPostInput) => ({ ...prev, job_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit_description">Job Description</Label>
              <Textarea
                id="edit_description"
                value={jobForm.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setJobForm((prev: CreateJobPostInput) => ({ ...prev, description: e.target.value }))
                }
                rows={6}
                required
              />
            </div>
            
            <div>
              <Label>Skills & Technologies</Label>
              <div className="flex space-x-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
                  placeholder="Add a skill"
                  onKeyPress={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {jobForm.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary" className="cursor-pointer">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            
            <DialogFooter>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Updating...' : 'Update Job'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
