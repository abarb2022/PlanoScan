package com.example.demo.service;

import com.example.demo.ai.AiScoringClient;
import com.example.demo.ai.model.ScoringRequest;
import com.example.demo.ai.model.ScoringResult;
import com.example.demo.entity.Planogram;
import com.example.demo.entity.Product;
import com.example.demo.entity.Score;
import com.example.demo.entity.Submission;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.ScoreRepository;
import com.example.demo.repository.SubmissionRepository;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScoringService {

  private static final String MIME_JPEG = "image/jpeg";
  private static final String MIME_PNG = "image/png";

  private final SubmissionRepository submissionRepository;
  private final ScoreRepository scoreRepository;
  private final ProductRepository productRepository;
  private final AiScoringClient aiClient;
  private final ImageResizeService imageResizeService;

  @Value("${app.upload.dir}")
  private String uploadDir;

  @Value("${scoring.flag-threshold:90}")
  private int flagThreshold;

  @Value("${scoring.max-attempts:3}")
  private int maxAttempts;

  @Transactional
  public void scoreSubmission(Submission submission) {
    submission.setScoringAttempts(submission.getScoringAttempts() + 1);
    submission.setStatus(Submission.Status.PROCESSING);
    submissionRepository.save(submission);

    try {
      ScoringResult result = callAi(submission);
      persistScore(submission, result);
    } catch (Exception e) {
      log.error(
          "Scoring failed for submission {} (attempt {}): {}",
          submission.getId(),
          submission.getScoringAttempts(),
          e.getMessage(),
          e);

      if (submission.getScoringAttempts() >= maxAttempts) {
        log.warn(
            "Submission {} exhausted {} scoring attempts, marking REVIEWED to skip",
            submission.getId(),
            maxAttempts);
        submission.setStatus(Submission.Status.REVIEWED);
      } else {
        submission.setStatus(Submission.Status.PENDING);
      }
      submissionRepository.save(submission);
    }
  }

  private ScoringResult callAi(Submission submission) throws IOException {
    Planogram planogram = submission.getPlanogram();

    byte[] photoBytes = readFile(submission.getPhotoUrl());
    byte[] resizedPhoto = imageResizeService.resizeForAi(photoBytes);
    String photoMime = guessMime(submission.getPhotoUrl());

    List<ScoringRequest.ProductReference> refs = buildProductRefs(planogram);

    ScoringRequest request =
        new ScoringRequest(planogram.getLayoutSpec(), resizedPhoto, photoMime, refs);

    return aiClient.scoreSubmission(request);
  }

  private void persistScore(Submission submission, ScoringResult result) {
    Map<String, Object> detail =
        Map.of(
            "subScores",
            Map.of(
                "brandAccuracy", result.subScores().brandAccuracy(),
                "quantityAccuracy", result.subScores().quantityAccuracy(),
                "positionAccuracy", result.subScores().positionAccuracy(),
                "stockFullness", result.subScores().stockFullness()),
            "violations",
            result.violations().stream()
                .map(
                    v ->
                        Map.of(
                            "severity", v.severity(),
                            "shelf", v.shelf(),
                            "section", v.section(),
                            "expected", v.expected(),
                            "found", v.found(),
                            "issue", v.issue()))
                .toList(),
            "confidence", result.confidence(),
            "notes", result.notes() == null ? "" : result.notes());

    Score score =
        Score.builder()
            .submission(submission)
            .overallScore((float) result.overallScore())
            .detailFlags(detail)
            .aiModelVersion(aiClient.modelVersion())
            .build();

    scoreRepository.save(score);

    boolean hasHighViolation =
        result.violations().stream().anyMatch(v -> "HIGH".equals(v.severity()));
    boolean belowThreshold = result.overallScore() < flagThreshold;

    submission.setStatus(Submission.Status.SCORED);
    submission.setFlaggedForReview(hasHighViolation || belowThreshold);
    submissionRepository.save(submission);

    log.info(
        "Submission {} scored: {}/100 (flagged={})",
        submission.getId(),
        result.overallScore(),
        submission.isFlaggedForReview());
  }

  private List<ScoringRequest.ProductReference> buildProductRefs(Planogram planogram) {
    if (planogram.getLayoutSpec() == null) return List.of();

    List<String> productNames = extractProductNames(planogram.getLayoutSpec());
    List<ScoringRequest.ProductReference> refs = new ArrayList<>();

    for (String name : productNames) {
      productRepository
          .findByNameIgnoreCaseAndCompanyId(name, planogram.getCompany().getId())
          .ifPresentOrElse(
              product -> {
                if (product.getReferenceImageUrl() != null) {
                  try {
                    byte[] imgBytes = readFile(product.getReferenceImageUrl());
                    byte[] resized = imageResizeService.resizeForAi(imgBytes);
                    refs.add(
                        new ScoringRequest.ProductReference(
                            product.getName(), resized, MIME_JPEG));
                  } catch (IOException e) {
                    log.warn("Could not read reference image for product {}: {}", name, e.getMessage());
                  }
                }
              },
              () -> log.debug("No exact product match found for '{}' in planogram", name));
    }

    return refs;
  }

  @SuppressWarnings("unchecked")
  private List<String> extractProductNames(Map<String, Object> layoutSpec) {
    List<String> names = new ArrayList<>();
    Object shelves = layoutSpec.get("shelves");
    if (!(shelves instanceof List<?> shelfList)) return names;

    for (Object shelf : shelfList) {
      if (!(shelf instanceof Map<?, ?> shelfMap)) continue;
      Object sections = shelfMap.get("sections");
      if (!(sections instanceof List<?> sectionList)) continue;

      for (Object section : sectionList) {
        if (!(section instanceof Map<?, ?> sectionMap)) continue;
        Object productName = sectionMap.get("productName");
        if (productName instanceof String name && !name.isBlank()) {
          names.add(name);
        }
      }
    }
    return names;
  }

  private byte[] readFile(String url) throws IOException {
    // URL is "/uploads/subdir/filename" — resolve against upload dir
    String relativePath = url.startsWith("/uploads/") ? url.substring("/uploads/".length()) : url;
    Path file = Paths.get(uploadDir).resolve(relativePath).normalize();
    return Files.readAllBytes(file);
  }

  private String guessMime(String url) {
    if (url == null) return MIME_JPEG;
    String lower = url.toLowerCase();
    if (lower.endsWith(".png")) return MIME_PNG;
    return MIME_JPEG;
  }
}
