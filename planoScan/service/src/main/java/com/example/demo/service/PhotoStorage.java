package com.example.demo.service;

import org.springframework.web.multipart.MultipartFile;

public interface PhotoStorage {

  /**
   * Stores the file and returns a URL clients can use to retrieve it. The URL may be relative
   * (served by this backend) or absolute (e.g. a cloud storage/CDN URL) — callers must not assume
   * either shape.
   */
  String store(MultipartFile file, String subdir);
}
