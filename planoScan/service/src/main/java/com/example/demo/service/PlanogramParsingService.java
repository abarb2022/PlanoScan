package com.example.demo.service;

import com.example.demo.ai.AiScoringClient;
import com.example.demo.ai.model.PlanogramLayout;
import com.example.demo.repository.PlanogramRepository;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlanogramParsingService {

  private final AiScoringClient aiClient;
  private final PlanogramRepository planogramRepository;

  @Async
  public void parseAsync(UUID planogramId, MultipartFile image) {
    try {
      byte[] bytes = image.getBytes();
      String mimeType = image.getContentType() != null ? image.getContentType() : "image/jpeg";

      PlanogramLayout layout = aiClient.parsePlanogram(bytes, mimeType);

      planogramRepository
          .findById(planogramId)
          .ifPresent(p -> {
            p.setLayoutSpec(AiScoringClient.layoutToMap(layout));
            planogramRepository.save(p);
            log.info("Planogram {} parsed: {} shelves", planogramId, layout.totalShelves());
          });
    } catch (IOException e) {
      log.error("Could not read planogram image bytes for parsing: {}", planogramId, e);
    } catch (Exception e) {
      log.error("Planogram parsing failed for {}: {}", planogramId, e.getMessage(), e);
    }
  }
}
