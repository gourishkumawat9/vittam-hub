import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { Prisma } from "@prisma/client";
import type { CreateJobInput, JobSearchFilters, RespondToApplicationInput, ApplyToJobInput, UpdateJobInput } from "@vittamhub/types";
import { buildPaginatedResult, paginationToOffset } from "@vittamhub/utils";

import { PrismaService } from "../../database/prisma/prisma.service";

/** Named `hiring` internally to avoid the existing BullMQ `jobs/` (email queue) module — the HTTP path `v1/jobs` is free since that module has no controller. */
@Injectable()
export class HiringService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createJob(founderId: string, input: CreateJobInput) {
    const startup = await this.prisma.startup.findUnique({ where: { ownerId: founderId } });
    if (!startup) throw new BadRequestException("Complete your startup profile before posting a job.");
    return this.prisma.job.create({ data: { ...input, startupId: startup.id } });
  }

  async updateJob(founderId: string, jobId: string, input: UpdateJobInput) {
    const job = await this.assertOwnsJob(founderId, jobId);
    return this.prisma.job.update({ where: { id: job.id }, data: input });
  }

  async closeJob(founderId: string, jobId: string) {
    const job = await this.assertOwnsJob(founderId, jobId);
    return this.prisma.job.update({ where: { id: job.id }, data: { status: "CLOSED", closedAt: new Date() } });
  }

  listForMyStartup(founderId: string) {
    return this.prisma.job.findMany({ where: { startup: { ownerId: founderId } }, orderBy: { createdAt: "desc" } });
  }

  async search(filters: JobSearchFilters) {
    const where: Prisma.JobWhereInput = {
      status: "OPEN",
      ...(filters.employmentType?.length ? { employmentType: { in: filters.employmentType } } : {}),
      ...(filters.location ? { location: { contains: filters.location, mode: "insensitive" } } : {}),
      ...(filters.isRemote !== undefined ? { isRemote: filters.isRemote } : {}),
      ...(filters.skills?.length ? { skills: { hasSome: filters.skills } } : {}),
      ...(filters.query
        ? {
            OR: [
              { title: { contains: filters.query, mode: "insensitive" } },
              { description: { contains: filters.query, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const { skip, take } = paginationToOffset(filters.page, filters.pageSize);
    const [items, totalItems] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { startup: { select: { id: true, name: true, slug: true, logoUrl: true } } },
      }),
      this.prisma.job.count({ where }),
    ]);

    return buildPaginatedResult(items, totalItems, filters.page, filters.pageSize);
  }

  async apply(applicantId: string, jobId: string, input: ApplyToJobInput) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.status !== "OPEN") throw new NotFoundException("Job not found or no longer open");

    try {
      const application = await this.prisma.jobApplication.create({
        data: { jobId, applicantId, resumeUrl: input.resumeUrl, coverLetter: input.coverLetter },
      });

      const [applicant, startup] = await Promise.all([
        this.prisma.user.findUniqueOrThrow({ where: { id: applicantId } }),
        this.prisma.startup.findUniqueOrThrow({ where: { id: job.startupId } }),
      ]);
      this.eventEmitter.emit("hiring.applied", { founderId: startup.ownerId, applicantName: applicant.fullName, jobTitle: job.title });

      return application;
    } catch {
      throw new ConflictException("You've already applied to this job");
    }
  }

  async listApplicationsForJob(founderId: string, jobId: string) {
    await this.assertOwnsJob(founderId, jobId);
    return this.prisma.jobApplication.findMany({
      where: { jobId },
      orderBy: { createdAt: "desc" },
      include: { applicant: { select: { id: true, fullName: true, avatarUrl: true } } },
    });
  }

  listMyApplications(applicantId: string) {
    return this.prisma.jobApplication.findMany({
      where: { applicantId },
      orderBy: { createdAt: "desc" },
      include: { job: { include: { startup: { select: { id: true, name: true, slug: true, logoUrl: true } } } } },
    });
  }

  async respondToApplication(founderId: string, applicationId: string, status: RespondToApplicationInput["status"]) {
    const application = await this.prisma.jobApplication.findUnique({ where: { id: applicationId }, include: { job: true } });
    if (!application) throw new NotFoundException("Application not found");

    const startup = await this.prisma.startup.findUnique({ where: { ownerId: founderId } });
    if (!startup || application.job.startupId !== startup.id) throw new ForbiddenException("Not your job posting");

    const updated = await this.prisma.jobApplication.update({ where: { id: applicationId }, data: { status } });
    this.eventEmitter.emit("hiring.application-responded", {
      applicantId: application.applicantId,
      jobTitle: application.job.title,
      status,
    });

    return updated;
  }

  private async assertOwnsJob(founderId: string, jobId: string) {
    const startup = await this.prisma.startup.findUnique({ where: { ownerId: founderId } });
    if (!startup) throw new ForbiddenException("You don't have a startup profile");

    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.startupId !== startup.id) throw new NotFoundException("Job not found");
    return job;
  }
}
