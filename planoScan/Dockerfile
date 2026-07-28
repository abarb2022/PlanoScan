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
# Render's free plan caps the container at 512MB RAM. The default JVM (no
# flags) can spike past that during startup — Hibernate's metamodel build is
# the heaviest moment — and gets SIGKILL'd (exit 137) before it ever binds a
# port. SerialGC has far lower baseline overhead than the default G1 on a
# small heap; MaxRAMPercentage keeps the heap itself container-aware instead
# of guessing; MaxMetaspaceSize stops class-metadata growth from being the
# thing that tips it over.
ENTRYPOINT ["java", "-XX:+UseSerialGC", "-XX:MaxRAMPercentage=60.0", "-XX:MaxMetaspaceSize=128m", "-jar", "app.jar"]
