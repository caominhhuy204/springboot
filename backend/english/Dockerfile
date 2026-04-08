FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
COPY src ./src
RUN mvn -B clean package -DskipTests

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar
ENV JAVA_TOOL_OPTIONS="-XX:+UseSerialGC -XX:TieredStopAtLevel=1 -XX:MaxRAMPercentage=75 -Djava.security.egd=file:/dev/./urandom"
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
