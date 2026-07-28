package com.example.demo.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.demo.exception.ErrorCode;
import com.example.demo.exception.ServerException;
import java.io.IOException;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@ConditionalOnProperty(name = "app.photo-storage", havingValue = "cloudinary")
public class CloudinaryPhotoStorage implements PhotoStorage {

  private static final Logger log = LoggerFactory.getLogger(CloudinaryPhotoStorage.class);

  private final Cloudinary cloudinary;

  public CloudinaryPhotoStorage(@Value("${cloudinary.url}") String cloudinaryUrl) {
    this.cloudinary = new Cloudinary(cloudinaryUrl);
  }

  @Override
  public String store(MultipartFile file, String subdir) {
    if (file.isEmpty()) {
      throw new ServerException(ErrorCode.VALIDATION_ERROR);
    }

    try {
      Map<?, ?> result =
          cloudinary
              .uploader()
              .upload(file.getBytes(), ObjectUtils.asMap("folder", subdir, "resource_type", "image"));
      return (String) result.get("secure_url");
    } catch (IOException e) {
      log.error("Failed to upload photo to Cloudinary (folder={})", subdir, e);
      throw new ServerException(ErrorCode.INTERNAL_ERROR);
    }
  }
}
