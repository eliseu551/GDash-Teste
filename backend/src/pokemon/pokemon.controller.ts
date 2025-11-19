import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/pokemon')
@UseGuards(JwtAuthGuard)
export class PokemonController {
  constructor(private readonly pokemonService: PokemonService) {}

  @Get()
  findAll(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    return this.pokemonService.findAll(limitNum, offsetNum);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pokemonService.findOne(id);
  }
}

