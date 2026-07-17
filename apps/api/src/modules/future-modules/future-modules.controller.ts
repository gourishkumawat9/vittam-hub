import { Controller, Get, Param } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { Public } from "../../common/decorators/public.decorator";

import { FutureModulesService } from "./future-modules.service";

@ApiTags("future-modules")
@Controller("v1/future-modules")
export class FutureModulesController {
  constructor(private readonly futureModulesService: FutureModulesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "List every module planned but not yet built, with its 'not available' status" })
  listAll() {
    return this.futureModulesService.listAll();
  }

  @Public()
  @Get(":slug")
  @ApiOperation({ summary: "Get a single future module's placeholder status" })
  getStatus(@Param("slug") slug: string) {
    return this.futureModulesService.getStatus(slug);
  }
}
