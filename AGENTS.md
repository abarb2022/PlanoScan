# AGENTS.md

## Build Commands

- Run app: `cd demo && ./gradlew bootRun`
- Run tests: `cd demo && ./gradlew test`
- Build: `cd demo && ./gradlew build`

## Dependencies

- Java 17, Spring Boot 3.5.13
- PostgreSQL required on `localhost:5432` with credentials `postgres/admin`
- Uses JPA, Spring Security, Validation, Actuator

## Project Structure

- Single-module Gradle project in `demo/` directory
- Entry point: `DemoApplication.java`