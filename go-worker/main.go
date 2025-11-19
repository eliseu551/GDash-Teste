package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

type WeatherData struct {
	Timestamp string `json:"timestamp"`
	Location  struct {
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
	} `json:"location"`
	Current struct {
		Temperature float64 `json:"temperature"`
		Humidity    float64 `json:"humidity"`
		WindSpeed   float64 `json:"wind_speed"`
		WeatherCode int     `json:"weather_code"`
	} `json:"current"`
	Forecast struct {
		Temperatures           []float64 `json:"temperatures"`
		Humidity               []float64 `json:"humidity"`
		PrecipitationProbability []float64 `json:"precipitation_probability"`
	} `json:"forecast"`
}

func failOnError(err error, msg string) {
	if err != nil {
		log.Panicf("%s: %s", msg, err)
	}
}

func sendToAPI(data WeatherData, apiURL string) error {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("erro ao serializar JSON: %w", err)
	}

	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("erro ao criar requisição: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("erro ao enviar requisição: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		return fmt.Errorf("resposta da API com status %d", resp.StatusCode)
	}

	log.Printf("Dados enviados para API com sucesso: %s", data.Timestamp)
	return nil
}

func main() {
	rabbitmqHost := getEnv("RABBITMQ_HOST", "localhost")
	rabbitmqPort := getEnv("RABBITMQ_PORT", "5672")
	rabbitmqUser := getEnv("RABBITMQ_USER", "admin")
	rabbitmqPassword := getEnv("RABBITMQ_PASSWORD", "admin123")
	queueName := getEnv("RABBITMQ_QUEUE", "weather_data")
	apiURL := getEnv("API_URL", "http://localhost:3000/api/weather/logs")

	connStr := fmt.Sprintf("amqp://%s:%s@%s:%s/", rabbitmqUser, rabbitmqPassword, rabbitmqHost, rabbitmqPort)

	log.Println("Aguardando RabbitMQ estar disponível...")
	var conn *amqp.Connection
	maxRetries := 30
	retryInterval := 2 * time.Second
	
	for i := 0; i < maxRetries; i++ {
		var err error
		conn, err = amqp.Dial(connStr)
		if err == nil {
			log.Println("RabbitMQ está disponível")
			break
		}
		if i < maxRetries-1 {
			log.Printf("Aguardando RabbitMQ estar pronto... (tentativa %d/%d)", i+1, maxRetries)
			time.Sleep(retryInterval)
		} else {
			failOnError(err, "Falha ao conectar ao RabbitMQ após múltiplas tentativas")
		}
	}
	defer conn.Close()

	ch, err := conn.Channel()
	failOnError(err, "Falha ao abrir canal")
	defer ch.Close()

	_, err = ch.QueueDeclare(
		queueName,
		true,
		false,
		false,
		false,
		nil,
	)
	failOnError(err, "Falha ao declarar fila")

	err = ch.Qos(
		1,
		0,
		false,
	)
	failOnError(err, "Falha ao configurar QoS")

	msgs, err := ch.Consume(
		queueName,
		"",
		false,
		false,
		false,
		false,
		nil,
	)
	failOnError(err, "Falha ao registrar consumidor")

	log.Println("Worker Go iniciado. Aguardando mensagens...")

	var retryCount int
	apiMaxRetries := 3

	for msg := range msgs {
		var weatherData WeatherData
		err := json.Unmarshal(msg.Body, &weatherData)
		if err != nil {
			log.Printf("Erro ao deserializar mensagem: %v", err)
			msg.Nack(false, false)
			continue
		}

		log.Printf("Processando dados climáticos: %s", weatherData.Timestamp)

		retryCount = 0
		success := false

		for retryCount < apiMaxRetries && !success {
			err = sendToAPI(weatherData, apiURL)
			if err != nil {
				retryCount++
				log.Printf("Tentativa %d/%d falhou: %v", retryCount, apiMaxRetries, err)
				if retryCount < apiMaxRetries {
					time.Sleep(time.Duration(retryCount) * time.Second)
				}
			} else {
				success = true
			}
		}

		if success {
			msg.Ack(false)
		} else {
			log.Printf("Falha ao processar após %d tentativas. Rejeitando mensagem.", apiMaxRetries)
			msg.Nack(false, true)
		}
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

