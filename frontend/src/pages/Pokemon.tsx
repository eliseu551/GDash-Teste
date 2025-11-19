import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface Pokemon {
  id: number;
  name: string;
  image: string;
  types: string[];
}

interface PokemonDetail extends Pokemon {
  height: number;
  weight: number;
  abilities: string[];
  stats: { name: string; value: number }[];
}

export const Pokemon = () => {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  useEffect(() => {
    loadPokemons();
  }, [offset]);

  const loadPokemons = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/pokemon?limit=20&offset=${offset}`);
      setPokemons(response.data.results);
      setHasNext(!!response.data.next);
      setHasPrevious(!!response.data.previous);
    } catch (error) {
      console.error('Erro ao carregar Pokémons:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPokemonDetail = async (id: number) => {
    try {
      const response = await api.get(`/api/pokemon/${id}`);
      setSelectedPokemon(response.data);
    } catch (error) {
      console.error('Erro ao carregar detalhes do Pokémon:', error);
    }
  };

  if (loading && pokemons.length === 0) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Carregando...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-6 space-y-6">
        <h2 className="text-3xl font-bold text-gray-900">Explorar Pokémons</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Pokémons</CardTitle>
                <CardDescription>Explore a PokéAPI</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {pokemons.map((pokemon) => (
                    <div
                      key={pokemon.id}
                      className="border rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => loadPokemonDetail(pokemon.id)}
                    >
                      <img src={pokemon.image} alt={pokemon.name} className="w-full h-24 object-contain mb-2" />
                      <h3 className="font-semibold capitalize text-center">{pokemon.name}</h3>
                      <div className="flex flex-wrap gap-1 justify-center mt-1">
                        {pokemon.types.map((type) => (
                          <span key={type} className="text-xs bg-gray-200 px-2 py-1 rounded capitalize">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setOffset(Math.max(0, offset - 20))}
                    disabled={!hasPrevious}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setOffset(offset + 20)}
                    disabled={!hasNext}
                  >
                    Próximo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            {selectedPokemon ? (
              <Card>
                <CardHeader>
                  <CardTitle className="capitalize">{selectedPokemon.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <img src={selectedPokemon.image} alt={selectedPokemon.name} className="w-full" />
                  <div>
                    <h4 className="font-semibold mb-2">Tipos</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedPokemon.types.map((type) => (
                        <span key={type} className="bg-blue-100 text-blue-800 px-3 py-1 rounded capitalize">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Estatísticas</h4>
                    <div className="space-y-1">
                      {selectedPokemon.stats.map((stat) => (
                        <div key={stat.name} className="flex justify-between">
                          <span className="capitalize text-sm">{stat.name.replace('-', ' ')}:</span>
                          <span className="font-semibold">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Habilidades</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedPokemon.abilities.map((ability) => (
                        <span key={ability} className="bg-gray-100 px-2 py-1 rounded text-sm capitalize">
                          {ability.replace('-', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <span className="text-sm text-gray-500">Altura</span>
                      <p className="font-semibold">{selectedPokemon.height / 10}m</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Peso</span>
                      <p className="font-semibold">{selectedPokemon.weight / 10}kg</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  Selecione um Pokémon para ver os detalhes
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

