import { Body, Controller, Get, Param, Patch, Post, Query, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  applyToJobInputSchema,
  createJobInputSchema,
  jobSearchFiltersSchema,
  respondToApplicationInputSchema,
  updateJobInputSchema,
  type ApplyToJobInput,
  type CreateJobInput,
  type JobSearchFilters,
  type RespondToApplicationInput,
  type UpdateJobInput,
} from "@vittamhub/types";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

import { HiringService } from "./hiring.service";

@ApiTags("hiring")
@Controller("v1/jobs")
export class HiringController {
  constructor(private readonly hiringService: HiringService) {}

  @Public()
  @Get()
  @UsePipes(new ZodValidationPipe(jobSearchFiltersSchema))
  @ApiOperation({ summary: "Browse open job postings across every startup" })
  search(@Query() filters: JobSearchFilters) {
    return this.hiringService.search(filters);
  }

  @Get("mine")
  @Roles("FOUNDER")
  @ApiOperation({ summary: "List the caller's own startup's job postings" })
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.hiringService.listForMyStartup(user.sub);
  }

  @Get("applications/mine")
  @ApiOperation({ summary: "List the caller's own job applications" })
  listMyApplications(@CurrentUser() user: AuthenticatedUser) {
    return this.hiringService.listMyApplications(user.sub);
  }

  @Post()
  @Roles("FOUNDER")
  @UsePipes(new ZodValidationPipe(createJobInputSchema))
  @ApiOperation({ summary: "Post a job tied to the caller's startup" })
  create(@CurrentUser() user: AuthenticatedUser, @Body() input: CreateJobInput) {
    return this.hiringService.createJob(user.sub, input);
  }

  @Patch(":id")
  @Roles("FOUNDER")
  @UsePipes(new ZodValidationPipe(updateJobInputSchema))
  @ApiOperation({ summary: "Update one of the caller's own job postings" })
  update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() input: UpdateJobInput) {
    return this.hiringService.updateJob(user.sub, id, input);
  }

  @Post(":id/close")
  @Roles("FOUNDER")
  @ApiOperation({ summary: "Close one of the caller's own job postings" })
  close(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.hiringService.closeJob(user.sub, id);
  }

  @Post(":id/apply")
  @UsePipes(new ZodValidationPipe(applyToJobInputSchema))
  @ApiOperation({ summary: "Apply to an open job" })
  apply(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() input: ApplyToJobInput) {
    return this.hiringService.apply(user.sub, id, input);
  }

  @Get(":id/applications")
  @Roles("FOUNDER")
  @ApiOperation({ summary: "List applicants for one of the caller's own job postings" })
  listApplications(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.hiringService.listApplicationsForJob(user.sub, id);
  }

  @Patch("applications/:id")
  @Roles("FOUNDER")
  @UsePipes(new ZodValidationPipe(respondToApplicationInputSchema))
  @ApiOperation({ summary: "Shortlist, reject, or hire an applicant" })
  respondToApplication(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() input: RespondToApplicationInput) {
    return this.hiringService.respondToApplication(user.sub, id, input.status);
  }
}
