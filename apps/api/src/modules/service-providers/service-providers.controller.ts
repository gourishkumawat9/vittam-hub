import { Controller, Get, Param, Query, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { serviceProviderSearchFiltersSchema, type ServiceProviderSearchFilters } from "@vittamhub/types";

import { Public } from "../../common/decorators/public.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";

import { ServiceProvidersService } from "./service-providers.service";

@ApiTags("service-providers")
@Controller("v1/service-providers")
@Public()
export class ServiceProvidersController {
  constructor(private readonly serviceProvidersService: ServiceProvidersService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(serviceProviderSearchFiltersSchema))
  @ApiOperation({ summary: "Browse service-provider profiles, filterable by category" })
  list(@Query() filters: ServiceProviderSearchFilters) {
    return this.serviceProvidersService.list(filters);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a public service-provider profile" })
  getById(@Param("id") id: string) {
    return this.serviceProvidersService.getById(id);
  }
}
