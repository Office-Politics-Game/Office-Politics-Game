# deployment-backend-endpoints Specification

## Purpose

Define how the frontend resolves backend HTTP API and Socket.IO endpoints for deployed environments while preserving local development fallback behavior.

## Requirements

### Requirement: Configurable backend endpoints

The frontend SHALL use `VITE_API_BASE_URL` as the HTTP API base URL when the variable is defined. The frontend SHALL fall back to `/api` as the HTTP API base URL when `VITE_API_BASE_URL` is not defined.

The frontend SHALL use `VITE_SOCKET_URL` as the Socket.IO server URL when the variable is defined. The frontend SHALL fall back to `/` as the Socket.IO server URL when `VITE_SOCKET_URL` is not defined.

#### Scenario: Production API endpoint uses Vite environment variable

- **WHEN** `VITE_API_BASE_URL` is set to `https://backend.example.com/api`
- **THEN** HTTP API requests use `https://backend.example.com/api` as the base URL

#### Scenario: Local API endpoint falls back to Vite proxy path

- **WHEN** `VITE_API_BASE_URL` is not set
- **THEN** HTTP API requests use `/api` as the base URL

#### Scenario: Production socket endpoint uses Vite environment variable

- **WHEN** `VITE_SOCKET_URL` is set to `https://backend.example.com`
- **THEN** Socket.IO connects to `https://backend.example.com`

#### Scenario: Local socket endpoint falls back to current origin

- **WHEN** `VITE_SOCKET_URL` is not set
- **THEN** Socket.IO connects to `/`
