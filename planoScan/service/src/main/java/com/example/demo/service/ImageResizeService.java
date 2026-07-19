package com.example.demo.service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ImageResizeService {

  private final int maxPx;

  public ImageResizeService(@Value("${gemini.max-image-px:1024}") int maxPx) {
    this.maxPx = maxPx;
  }

  /**
   * Resizes an image so its longest dimension is at most maxPx. If the image is already smaller,
   * it is returned as-is in JPEG format. Always outputs JPEG to keep token cost predictable.
   */
  public byte[] resizeForAi(byte[] original) {
    try {
      ByteArrayOutputStream out = new ByteArrayOutputStream();
      Thumbnails.of(new ByteArrayInputStream(original))
          .size(maxPx, maxPx)
          .keepAspectRatio(true)
          .outputFormat("jpg")
          .toOutputStream(out);
      return out.toByteArray();
    } catch (IOException e) {
      // If resizing fails return original — scoring degrades gracefully
      return original;
    }
  }
}
