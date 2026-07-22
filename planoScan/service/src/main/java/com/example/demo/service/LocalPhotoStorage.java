package com.example.demo.service;

import com.example.demo.exception.ErrorCode;
import com.example.demo.exception.ServerException;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class LocalPhotoStorage implements PhotoStorage {

  private static final Logger log = LoggerFactory.getLogger(LocalPhotoStorage.class);

  // Extension is chosen from the verified image format, never from client-supplied input, so an
  // upload can't be smuggled onto disk (and later served) as .html/.svg/etc.
  private static final Map<String, String> EXTENSION_BY_FORMAT =
      Map.of(
          "jpeg", ".jpg",
          "png", ".png",
          "gif", ".gif",
          "bmp", ".bmp");

  private final Path uploadRoot;
  private final Set<Path> ensuredDirectories = ConcurrentHashMap.newKeySet();

  public LocalPhotoStorage(@Value("${app.upload.dir}") String uploadDir) {
    this.uploadRoot = Path.of(uploadDir).toAbsolutePath().normalize();
  }

  @Override
  public String store(MultipartFile file, String subdir) {
    if (file.isEmpty()) {
      throw new ServerException(ErrorCode.VALIDATION_ERROR);
    }

    byte[] content;
    try {
      content = file.getBytes();
    } catch (IOException e) {
      throw new ServerException(ErrorCode.VALIDATION_ERROR);
    }

    String extension = verifiedImageExtension(content);

    Path targetDir = uploadRoot.resolve(subdir).normalize();

    try {
      if (ensuredDirectories.add(targetDir)) {
        Files.createDirectories(targetDir);
      }

      String filename = UUID.randomUUID() + extension;
      Path targetFile = targetDir.resolve(filename);
      Files.write(targetFile, content);

      return "/uploads/" + subdir + "/" + filename;
    } catch (IOException e) {
      log.error("Failed to store uploaded photo in {}", targetDir, e);
      throw new ServerException(ErrorCode.INTERNAL_ERROR);
    }
  }

  @Override
  public void delete(String url) {
    if (url == null || url.isBlank()) return;

    String relativePath = url.startsWith("/uploads/") ? url.substring("/uploads/".length()) : url;
    Path file = uploadRoot.resolve(relativePath).normalize();

    if (!file.startsWith(uploadRoot)) {
      log.warn("Refusing to delete path outside upload root: {}", url);
      return;
    }

    try {
      Files.deleteIfExists(file);
    } catch (IOException e) {
      log.warn("Failed to delete photo file {}: {}", url, e.getMessage());
    }
  }

  /**
   * Determines the file's real image format by sniffing its content and returns the
   * matching safe extension. Rejects anything that isn't a genuine, decodable raster image.
   */
  private String verifiedImageExtension(byte[] content) {
    try (ImageInputStream iis = ImageIO.createImageInputStream(new ByteArrayInputStream(content))) {
      Iterator<ImageReader> readers = ImageIO.getImageReaders(iis);
      if (!readers.hasNext()) {
        throw new ServerException(ErrorCode.VALIDATION_ERROR);
      }

      ImageReader reader = readers.next();
      try {
        String format = reader.getFormatName().toLowerCase();
        String extension = EXTENSION_BY_FORMAT.get(format);
        if (extension == null) {
          throw new ServerException(ErrorCode.VALIDATION_ERROR);
        }

        reader.setInput(iis);
        if (reader.getWidth(0) <= 0 || reader.getHeight(0) <= 0) {
          throw new ServerException(ErrorCode.VALIDATION_ERROR);
        }

        return extension;
      } finally {
        reader.dispose();
      }
    } catch (IOException e) {
      throw new ServerException(ErrorCode.VALIDATION_ERROR);
    }
  }
}
