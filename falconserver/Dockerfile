# Stage 1: Build
FROM golang:1.25-alpine AS builder

RUN apk add --no-cache gcc musl-dev

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=1 go build \
    -ldflags='-s -w -extldflags "-static"' \
    -o /falconserver .

# Stage 2: Final
FROM scratch

COPY --from=builder /falconserver /falconserver

EXPOSE 3002

ENTRYPOINT ["/falconserver"]
