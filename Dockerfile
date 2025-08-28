# Build stage
FROM golang:1.24.0-alpine AS builder
WORKDIR /build

RUN apk update && apk add bash git ca-certificates

# Set Go environment variables for better module resolution
ENV GO111MODULE=on
ENV GOPROXY=https://proxy.golang.org,direct
ENV GOSUMDB=sum.golang.org

# Install xk6 and build custom k6 binary with better error handling
RUN CGO_ENABLED=0 go install go.k6.io/xk6/cmd/xk6@latest \
    && CGO_ENABLED=0 xk6 build \
    --with github.com/grafana/xk6-output-prometheus-remote@latest \
    --output /tmp/k6

# Run stage
FROM alpine:3.18

# Add ca-certificates and create a non-root user
RUN apk add --no-cache ca-certificates \
    && adduser -D -u 12345 -g 12345 k6

# Copy the custom k6 binary
COPY --from=builder /tmp/k6 /usr/bin/k6

# Set working directory and copy the test script
USER 12345
WORKDIR /home/k6
COPY demo.js .


# Set entrypoint and optional default command
# ENTRYPOINT ["k6"]
# CMD ["run", "demo.js"]
