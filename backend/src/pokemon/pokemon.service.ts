import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PokemonService {
  private readonly baseUrl = 'https://pokeapi.co/api/v2';

  async findAll(limit = 20, offset = 0) {
    try {
      const response = await axios.get(`${this.baseUrl}/pokemon`, {
        params: { limit, offset },
      });
      
      const results = await Promise.all(
        response.data.results.map(async (pokemon: any) => {
          const detailResponse = await axios.get(pokemon.url);
          return {
            id: detailResponse.data.id,
            name: detailResponse.data.name,
            image: detailResponse.data.sprites.front_default,
            types: detailResponse.data.types.map((t: any) => t.type.name),
          };
        })
      );

      return {
        count: response.data.count,
        results,
        next: response.data.next,
        previous: response.data.previous,
      };
    } catch (error) {
      throw new Error('Erro ao buscar Pokémons');
    }
  }

  async findOne(id: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/pokemon/${id}`);
      return {
        id: response.data.id,
        name: response.data.name,
        image: response.data.sprites.front_default,
        types: response.data.types.map((t: any) => t.type.name),
        height: response.data.height,
        weight: response.data.weight,
        abilities: response.data.abilities.map((a: any) => a.ability.name),
        stats: response.data.stats.map((s: any) => ({
          name: s.stat.name,
          value: s.base_stat,
        })),
      };
    } catch (error) {
      throw new Error('Pokémon não encontrado');
    }
  }
}

