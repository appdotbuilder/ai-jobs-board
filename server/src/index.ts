
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import all schemas
import { 
  createUserInputSchema,
  loginInputSchema,
  createJobPostInputSchema,
  updateJobPostInputSchema,
  getJobPostInputSchema,
  deleteJobPostInputSchema,
  createJobApplicationInputSchema,
  getJobApplicationsInputSchema
} from './schema';

// Import all handlers
import { createUser } from './handlers/create_user';
import { loginUser } from './handlers/login_user';
import { createJobPost } from './handlers/create_job_post';
import { getJobPosts } from './handlers/get_job_posts';
import { getJobPost } from './handlers/get_job_post';
import { updateJobPost } from './handlers/update_job_post';
import { deleteJobPost } from './handlers/delete_job_post';
import { getEmployerJobPosts } from './handlers/get_employer_job_posts';
import { createJobApplication } from './handlers/create_job_application';
import { getJobApplications } from './handlers/get_job_applications';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  loginUser: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => loginUser(input)),

  // Job post routes
  createJobPost: publicProcedure
    .input(createJobPostInputSchema)
    .mutation(({ input }) => createJobPost(input)),

  getJobPosts: publicProcedure
    .query(() => getJobPosts()),

  getJobPost: publicProcedure
    .input(getJobPostInputSchema)
    .query(({ input }) => getJobPost(input)),

  updateJobPost: publicProcedure
    .input(updateJobPostInputSchema)
    .mutation(({ input }) => updateJobPost(input)),

  deleteJobPost: publicProcedure
    .input(deleteJobPostInputSchema)
    .mutation(({ input }) => deleteJobPost(input)),

  getEmployerJobPosts: publicProcedure
    .input(z.number())
    .query(({ input }) => getEmployerJobPosts(input)),

  // Job application routes
  createJobApplication: publicProcedure
    .input(createJobApplicationInputSchema)
    .mutation(({ input }) => createJobApplication(input)),

  getJobApplications: publicProcedure
    .input(getJobApplicationsInputSchema)
    .query(({ input }) => getJobApplications(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
