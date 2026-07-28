# --- Build stage: compile the app into a runnable jar ---
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

COPY gradlew gradlew.bat ./
COPY gradle gradle
COPY build.gradle settings.gradle ./
COPY service service

RUN chmod +x gradlew && ./gradlew bootJar -x test --no-daemon

# --- Run stage: slim image with just the JRE and the built jar ---
FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
