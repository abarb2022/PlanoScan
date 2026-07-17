package com.example.demo.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

  @Value("${app.upload.dir}")
  private String uploadDir;

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    Path uploadRoot = Path.of(uploadDir).toAbsolutePath().normalize();
    try {
      Files.createDirectories(uploadRoot);
    } catch (IOException e) {
      throw new IllegalStateException("Could not create upload directory: " + uploadRoot, e);
    }

    // Path.toUri() only appends a trailing slash if the directory exists at call time, and a
    // missing slash makes Spring treat "uploads" as a filename to replace rather than a directory
    // to resolve under, breaking every /uploads/** request for the life of the process.
    String location = uploadRoot.toUri().toString();
    registry.addResourceHandler("/uploads/**").addResourceLocations(location);
  }
}
