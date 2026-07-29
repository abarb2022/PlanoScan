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
# Render's free plan hard-caps the container at 512MB RAM — an instant kill on
# breach, not a soft target. A percentage-of-container heap (MaxRAMPercentage)
# wasn't tight enough once the app was doing real work (multiple requests,
# Hibernate entity graphs, image bytes in memory for uploads/scoring), not
# just idling at boot — so every major memory region is capped explicitly.
#
# These exact numbers were verified locally, not guessed: a first attempt at
# -XX:MaxMetaspaceSize=96m threw a real `OutOfMemoryError: Metaspace` on the
# very first HTTP request (Spring lazily loads a lot of MVC/Jackson/Security
# classes on first use) — capping metaspace too tight is a hard crash with no
# fallback, unlike heap, so it gets the bigger, safer share here. This
# combination was load-tested against login + create company + list
# companies/stores and stayed around ~290MB RSS, leaving real headroom under
# 512MB instead of running right up against it.
ENTRYPOINT ["java", \
  "-Xms96m", "-Xmx192m", \
  "-XX:+UseSerialGC", \
  "-XX:MaxMetaspaceSize=200m", \
  "-XX:ReservedCodeCacheSize=48m", \
  "-Xss512k", \
  "-jar", "app.jar"]
