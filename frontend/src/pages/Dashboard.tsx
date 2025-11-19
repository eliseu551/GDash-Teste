import { useEffect, useState, useCallback } from "react";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import api from "@/lib/api";
import { Download } from "lucide-react";

interface WeatherLog {
  _id: string;
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
  };
  current: {
    temperature: number;
    humidity: number;
    wind_speed: number;
    weather_code: number;
  };
}

interface Stats {
  averageTemperature: number;
  averageHumidity: number;
  averageWindSpeed: number;
  totalRecords: number;
}

interface Insights {
  insight: string;
}

export const Dashboard = () => {
  const [logs, setLogs] = useState<WeatherLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const REFRESH_INTERVAL = 30000; // 30 segundos

  const loadData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const [logsRes, statsRes, insightsRes] = await Promise.all([
        api.get("/api/weather/logs?limit=50"),
        api.get("/api/weather/stats"),
        api.get("/api/weather/insights"),
      ]);
      setLogs(logsRes.data);
      setStats(statsRes.data);
      setInsights(insightsRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData(true);

    const interval = setInterval(() => {
      loadData(false);
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [loadData]);

  const handleExportCSV = async () => {
    try {
      const response = await api.get("/api/weather/export.csv", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "weather-data.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Erro ao exportar CSV:", error);
    }
  };

  const handleExportXLSX = async () => {
    try {
      const response = await api.get("/api/weather/export.xlsx", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "weather-data.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Erro ao exportar XLSX:", error);
    }
  };

  const getWeatherCodeDescription = (code: number) => {
    const codes: { [key: number]: string } = {
      0: "Céu limpo",
      1: "Principalmente limpo",
      2: "Parcialmente nublado",
      3: "Nublado",
      45: "Nevoeiro",
      48: "Nevoeiro gelado",
      51: "Chuva leve",
      53: "Chuva moderada",
      55: "Chuva forte",
      61: "Chuva leve",
      63: "Chuva moderada",
      65: "Chuva forte",
      71: "Neve leve",
      73: "Neve moderada",
      75: "Neve forte",
    };
    return codes[code] || "Desconhecido";
  };

  const chartData = logs
    .slice(0, 20)
    .reverse()
    .map((log) => ({
      time: new Date(log.timestamp).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      temperatura: log.current.temperature,
      umidade: log.current.humidity,
    }));

  if (loading) {
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
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Dashboard de Clima
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Button variant="outline" onClick={handleExportXLSX}>
              <Download className="w-4 h-4 mr-2" />
              Exportar XLSX
            </Button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">
                  Temperatura Média
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.averageTemperature.toFixed(1)}°C
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">
                  Umidade Média
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.averageHumidity.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">
                  Velocidade do Vento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.averageWindSpeed.toFixed(1)} km/h
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total de Registros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRecords}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {insights && (
          <Card>
            <CardHeader>
              <CardTitle>Insights de IA</CardTitle>
              <CardDescription>
                Análise inteligente dos dados climáticos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{insights.insight}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Temperatura e Umidade ao Longo do Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="temperatura"
                    stroke="#3b82f6"
                    name="Temperatura (°C)"
                  />
                  <Line
                    type="monotone"
                    dataKey="umidade"
                    stroke="#10b981"
                    name="Umidade (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registros Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[320px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Temperatura</TableHead>
                      <TableHead>Umidade</TableHead>
                      <TableHead>Condição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.slice(0, 50).map((log) => (
                      <TableRow key={log._id}>
                        <TableCell>
                          {new Date(log.timestamp).toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell>{log.current.temperature}°C</TableCell>
                        <TableCell>{log.current.humidity}%</TableCell>
                        <TableCell>
                          {getWeatherCodeDescription(log.current.weather_code)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
