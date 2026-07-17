package com.example.demo.service;

import com.example.demo.exception.ErrorCode;
import com.example.demo.exception.ServerException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class LocalPhotoStorage implements PhotoStorage {

  private static final Logger log = LoggerFactory.getLogger(LocalPhotoStorage.class);

  private final Path uploadRoot;
  private final Set<Path> ensuredDirectories = ConcurrentHashMap.newKeySet();

  public LocalPhotoStorage(@Value("${app.upload.dir}") String uploadDir) {
    this.uploadRoot = Path.of(uploadDir).toAbsolutePath().normalize();
  }

  @Override
  public String store(MultipartFile file, String subdir) {
    if (file.isEmpty() || file.getContentType() == null || !file.getContentType().startsWith("image/")) {
      throw new ServerException(ErrorCode.VALIDATION_ERROR);
    }

    Path targetDir = uploadRoot.resolve(subdir).normalize();

    try {
      if (ensuredDirectories.add(targetDir)) {
        Files.createDirectories(targetDir);
      }

      String extension = extensionOf(file.getOriginalFilename());
      String filename = UUID.randomUUID() + extension;
      Path targetFile = targetDir.resolve(filename);
      file.transferTo(targetFile);

      return "/uploads/" + subdir + "/" + filename;
    } catch (IOException e) {
      log.error("Failed to store uploaded photo in {}", targetDir, e);
      throw new ServerException(ErrorCode.INTERNAL_ERROR);
    }
  }

  private String extensionOf(String originalFilename) {
    if (originalFilename == null) {
      return "";
    }
    int lastDot = originalFilename.lastIndexOf('.');
    return lastDot >= 0 ? originalFilename.substring(lastDot) : "";
  }
}
