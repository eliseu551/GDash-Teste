import os
import time
import json
import logging
import requests
from datetime import datetime
import pika

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def get_weather_data(latitude, longitude, api_url):
    """Coleta dados climáticos da API Open-Meteo"""
    try:
        params = {
            'latitude': latitude,
            'longitude': longitude,
            'current': 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
            'hourly': 'temperature_2m,relative_humidity_2m,precipitation_probability',
            'timezone': 'America/Sao_Paulo'
        }
        
        response = requests.get(api_url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        current = data.get('current', {})
        hourly = data.get('hourly', {})
        
        weather_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'location': {
                'latitude': float(latitude),
                'longitude': float(longitude)
            },
            'current': {
                'temperature': current.get('temperature_2m'),
                'humidity': current.get('relative_humidity_2m'),
                'wind_speed': current.get('wind_speed_10m'),
                'weather_code': current.get('weather_code')
            },
            'forecast': {
                'temperatures': hourly.get('temperature_2m', [])[:24],
                'humidity': hourly.get('relative_humidity_2m', [])[:24],
                'precipitation_probability': hourly.get('precipitation_probability', [])[:24]
            }
        }
        
        return weather_data
    except Exception as e:
        logger.error(f"Erro ao coletar dados climáticos: {e}")
        raise

def wait_for_rabbitmq(connection_params, max_retries=30, retry_interval=2):
    """Aguarda RabbitMQ estar disponível"""
    for attempt in range(max_retries):
        try:
            connection = pika.BlockingConnection(connection_params)
            connection.close()
            logger.info("RabbitMQ está disponível")
            return True
        except Exception as e:
            if attempt < max_retries - 1:
                logger.info(f"Aguardando RabbitMQ estar pronto... (tentativa {attempt + 1}/{max_retries})")
                time.sleep(retry_interval)
            else:
                logger.error(f"RabbitMQ não está disponível após {max_retries} tentativas: {e}")
                raise
    return False

def send_to_rabbitmq(weather_data, connection_params, queue_name):
    """Envia dados para a fila RabbitMQ"""
    try:
        connection = pika.BlockingConnection(connection_params)
        channel = connection.channel()
        
        channel.queue_declare(queue=queue_name, durable=True)
        
        message = json.dumps(weather_data)
        channel.basic_publish(
            exchange='',
            routing_key=queue_name,
            body=message,
            properties=pika.BasicProperties(
                delivery_mode=2,
            )
        )
        
        logger.info(f"Dados enviados para RabbitMQ: {weather_data['timestamp']}")
        connection.close()
    except Exception as e:
        logger.error(f"Erro ao enviar para RabbitMQ: {e}")
        raise

def main():
    """Loop principal de coleta e envio de dados"""
    rabbitmq_host = os.getenv('RABBITMQ_HOST', 'localhost')
    rabbitmq_port = int(os.getenv('RABBITMQ_PORT', 5672))
    rabbitmq_user = os.getenv('RABBITMQ_USER', 'admin')
    rabbitmq_password = os.getenv('RABBITMQ_PASSWORD', 'admin123')
    queue_name = os.getenv('RABBITMQ_QUEUE', 'weather_data')
    
    weather_api_url = os.getenv('WEATHER_API_URL', 'https://api.open-meteo.com/v1/forecast')
    latitude = os.getenv('LATITUDE', '-23.5505')
    longitude = os.getenv('LONGITUDE', '-46.6333')
    collection_interval = int(os.getenv('COLLECTION_INTERVAL', '3600'))
    
    connection_params = pika.ConnectionParameters(
        host=rabbitmq_host,
        port=rabbitmq_port,
        credentials=pika.PlainCredentials(rabbitmq_user, rabbitmq_password)
    )
    
    logger.info("Serviço Python iniciado")
    logger.info(f"Coletando dados de: {latitude}, {longitude}")
    logger.info(f"Intervalo de coleta: {collection_interval} segundos")
    
    logger.info("Aguardando RabbitMQ estar disponível...")
    wait_for_rabbitmq(connection_params)
    
    while True:
        try:
            weather_data = get_weather_data(latitude, longitude, weather_api_url)
            send_to_rabbitmq(weather_data, connection_params, queue_name)
            logger.info(f"Aguardando {collection_interval} segundos até próxima coleta...")
            time.sleep(collection_interval)
        except KeyboardInterrupt:
            logger.info("Serviço interrompido pelo usuário")
            break
        except Exception as e:
            logger.error(f"Erro no loop principal: {e}")
            logger.info(f"Aguardando {collection_interval} segundos antes de tentar novamente...")
            time.sleep(collection_interval)

if __name__ == '__main__':
    main()

