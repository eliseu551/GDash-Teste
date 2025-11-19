# GDASH - Sistema de Monitoramento Climático

Sistema full-stack desenvolvido para o desafio GDASH 2025/02, integrando múltiplas tecnologias para coleta, processamento e visualização de dados climáticos com insights de IA.

## 🏗️ Arquitetura

O sistema é composto pelos seguintes serviços:

- **Python Service**: Coleta dados climáticos da API Open-Meteo e envia para RabbitMQ
- **Go Worker**: Consome mensagens do RabbitMQ e envia para a API NestJS
- **NestJS API**: Backend com MongoDB para armazenamento e processamento de dados
- **React Frontend**: Interface web com dashboard, CRUD de usuários e integração com PokéAPI
- **MongoDB**: Banco de dados NoSQL para armazenamento
- **RabbitMQ**: Sistema de filas para processamento assíncrono

## 📋 Pré-requisitos

- Docker e Docker Compose instalados
- Git

## 🚀 Como Executar
##  Instalar dependencias:

cd frontend
npm i
cd ../backend
npm i
cd ..
### Opção 1: Docker Compose (Recomendado)

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd desafio-gdash
```

2. Execute o Docker Compose:
```bash
docker-compose up --build
```

3. Aguarde alguns minutos para todos os serviços iniciarem.

4. Acesse:
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:3000
   - **RabbitMQ Management**: http://localhost:15672 (admin/admin123)
   - **MongoDB**: localhost:27017

### Opção 2: Execução Manual

#### Backend (NestJS)

```bash
cd backend
npm install
npm run start:dev
```

#### Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

#### Python Service

```bash
cd python-service
pip install -r requirements.txt
python main.py
```

#### Go Worker

```bash
cd go-worker
go mod download
go run main.go
```

## 🔐 Credenciais Padrão

- **Email**: admin@example.com
- **Senha**: 123456

> **Nota**: O usuário padrão é criado automaticamente na inicialização do backend.

## 📡 Endpoints da API

### Autenticação

- `POST /api/auth/login` - Login de usuário
- `GET /api/auth/profile` - Perfil do usuário autenticado

### Clima

- `POST /api/weather/logs` - Criar registro climático (usado pelo Go worker)
- `GET /api/weather/logs` - Listar registros climáticos
- `GET /api/weather/stats` - Estatísticas dos dados climáticos
- `GET /api/weather/insights` - Gerar insights de IA
- `GET /api/weather/export.csv` - Exportar dados em CSV
- `GET /api/weather/export.xlsx` - Exportar dados em XLSX

### Usuários

- `GET /api/users` - Listar usuários
- `POST /api/users` - Criar usuário
- `GET /api/users/:id` - Obter usuário por ID
- `PATCH /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Excluir usuário

### Pokémons (Opcional)

- `GET /api/pokemon` - Listar Pokémons (com paginação)
- `GET /api/pokemon/:id` - Obter detalhes de um Pokémon

## 🔧 Variáveis de Ambiente

As variáveis de ambiente podem ser configuradas no arquivo `.env` ou diretamente no `docker-compose.yml`. Principais variáveis:

### Backend
- `MONGODB_URI`: URI de conexão com MongoDB
- `JWT_SECRET`: Chave secreta para JWT
- `PORT`: Porta do servidor (padrão: 3000)
- `DEFAULT_USER_EMAIL`: Email do usuário padrão
- `DEFAULT_USER_PASSWORD`: Senha do usuário padrão
- `OPENAI_API_KEY`: Chave da API OpenAI (opcional, para insights com IA)

### Python Service
- `RABBITMQ_HOST`: Host do RabbitMQ
- `RABBITMQ_PORT`: Porta do RabbitMQ
- `RABBITMQ_USER`: Usuário do RabbitMQ
- `RABBITMQ_PASSWORD`: Senha do RabbitMQ
- `RABBITMQ_QUEUE`: Nome da fila
- `WEATHER_API_URL`: URL da API de clima
- `LATITUDE`: Latitude da localização
- `LONGITUDE`: Longitude da localização
- `COLLECTION_INTERVAL`: Intervalo de coleta em segundos (padrão: 3600)

### Go Worker
- `RABBITMQ_HOST`: Host do RabbitMQ
- `RABBITMQ_PORT`: Porta do RabbitMQ
- `RABBITMQ_USER`: Usuário do RabbitMQ
- `RABBITMQ_PASSWORD`: Senha do RabbitMQ
- `RABBITMQ_QUEUE`: Nome da fila
- `API_URL`: URL da API NestJS

### Frontend
- `VITE_API_URL`: URL da API backend

## 📊 Funcionalidades

### Dashboard de Clima

- Visualização de dados climáticos em tempo real
- Cards com estatísticas (temperatura média, umidade, velocidade do vento)
- Gráficos de temperatura e umidade ao longo do tempo
- Tabela com registros recentes
- Insights de IA baseados nos dados históricos
- Exportação de dados em CSV e XLSX

### Gerenciamento de Usuários

- CRUD completo de usuários
- Autenticação com JWT
- Proteção de rotas

### Explorar Pokémons (Opcional)

- Listagem paginada de Pokémons da PokéAPI
- Visualização de detalhes de cada Pokémon
- Interface interativa com cards e informações detalhadas

## 🧠 Insights de IA

O sistema gera insights inteligentes sobre os dados climáticos coletados. Os insights incluem:

- Temperatura média e tendências
- Análise de umidade
- Pontuação de conforto climático (0-100)
- Alertas sobre condições climáticas
- Resumos em texto natural

Se uma chave da API OpenAI for configurada (`OPENAI_API_KEY`), os insights serão gerados usando GPT-3.5. Caso contrário, o sistema usa uma lógica baseada em regras.

## 🔄 Fluxo de Dados

1. **Coleta**: O serviço Python busca dados climáticos da API Open-Meteo a cada hora
2. **Fila**: Os dados são enviados para uma fila RabbitMQ
3. **Processamento**: O worker Go consome as mensagens da fila e valida os dados
4. **Armazenamento**: Os dados são enviados para a API NestJS e armazenados no MongoDB
5. **Visualização**: O frontend React consome a API e exibe os dados no dashboard
6. **Insights**: A API gera insights de IA a partir dos dados históricos

## 🛠️ Tecnologias Utilizadas

### Backend
- **NestJS**: Framework Node.js
- **MongoDB**: Banco de dados NoSQL
- **Mongoose**: ODM para MongoDB
- **JWT**: Autenticação
- **bcrypt**: Hash de senhas
- **ExcelJS**: Geração de arquivos XLSX
- **OpenAI**: Geração de insights com IA

### Frontend
- **React**: Biblioteca JavaScript
- **Vite**: Build tool
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Estilização
- **shadcn/ui**: Componentes UI
- **React Router**: Roteamento
- **Recharts**: Gráficos
- **Axios**: Cliente HTTP

### Infraestrutura
- **Docker**: Containerização
- **Docker Compose**: Orquestração de containers
- **RabbitMQ**: Sistema de filas

### Linguagens
- **Python**: Coleta de dados climáticos
- **Go**: Worker de processamento
- **TypeScript**: Backend e Frontend

## 📁 Estrutura do Projeto

```
desafio-gdash/
├── backend/                 # API NestJS
│   ├── src/
│   │   ├── auth/           # Módulo de autenticação
│   │   ├── users/          # Módulo de usuários
│   │   ├── weather/        # Módulo de clima
│   │   ├── pokemon/        # Módulo de Pokémons
│   │   └── main.ts         # Entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/                # Aplicação React
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── contexts/       # Contextos React
│   │   └── lib/           # Utilitários
│   ├── Dockerfile
│   └── package.json
├── python-service/          # Serviço Python
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── go-worker/               # Worker Go
│   ├── main.go
│   ├── go.mod
│   └── Dockerfile
├── docker-compose.yml       # Configuração Docker Compose
└── README.md               # Este arquivo
```

## 🐛 Troubleshooting

### Problemas comuns

1. **Porta já em uso**: Verifique se as portas 3000, 5173, 27017, 5672, 15672 estão livres
2. **Erro de conexão MongoDB**: Aguarde alguns segundos após iniciar o Docker Compose para o MongoDB estar pronto
3. **Erro de conexão RabbitMQ**: Verifique se o RabbitMQ está rodando e acessível
4. **Frontend não conecta ao backend**: Verifique a variável `VITE_API_URL` no frontend

### Logs

Para ver os logs de cada serviço:

```bash
docker-compose logs -f [nome-do-servico]
```

Exemplos:
- `docker-compose logs -f backend`
- `docker-compose logs -f python-service`
- `docker-compose logs -f go-worker`

## 📝 Notas Importantes

- O serviço Python coleta dados a cada hora por padrão (configurável via `COLLECTION_INTERVAL`)
- O usuário padrão é criado automaticamente na primeira inicialização
- Os insights de IA funcionam melhor com uma chave válida da OpenAI, mas também funcionam sem ela
- A localização padrão é São Paulo (-23.5505, -46.6333), mas pode ser alterada nas variáveis de ambiente

## 🎯 Melhorias Futuras

- Adicionar testes automatizados
- Implementar CI/CD
- Adicionar mais tipos de gráficos
- Implementar filtros avançados no dashboard
- Adicionar notificações em tempo real
- Melhorar tratamento de erros e retry logic

## 📄 Licença

Este projeto foi desenvolvido para o processo seletivo GDASH 2025/02.

---

Desenvolvido com ❤️ para o desafio GDASH

