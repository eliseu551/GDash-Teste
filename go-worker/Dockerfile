FROM golang:1.21-alpine AS builder

WORKDIR /build

COPY go.mod ./
COPY main.go ./

RUN go mod download && \
    go mod tidy && \
    CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags '-extldflags "-static"' -o worker main.go && \
    ls -lh worker

FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /app

COPY --from=builder /build/worker /app/worker

RUN chmod +x /app/worker && \
    ls -lh /app/worker

CMD ["/app/worker"]

