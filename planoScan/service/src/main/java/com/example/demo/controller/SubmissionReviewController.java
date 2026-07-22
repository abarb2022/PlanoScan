package com.example.demo.controller;

import com.example.demo.dto.review.FlaggedSubmissionDto;
import com.example.demo.dto.review.ReviewRequestDto;
import com.example.demo.dto.submission.SubmissionDetailDto;
import com.example.demo.dto.submission.SubmissionPageResponseDto;
import com.example.demo.service.SubmissionReviewService;
import com.example.demo.service.SubmissionService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/manager/submissions")
@CrossOrigin(origins = {"http://127.0.0.1:5173", "http://localhost:5173"})
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
public class SubmissionReviewController {

  private final SubmissionReviewService reviewService;
  private final SubmissionService submissionService;

  @GetMapping
  public ResponseEntity<SubmissionPageResponseDto> getSubmissions(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(required = false) UUID companyId,
      @RequestParam(required = false) UUID storeId,
      @RequestParam(required = false) UUID repId,
      @RequestParam(required = false) Integer stars,
      Authentication auth) {
    return ResponseEntity.ok(
        submissionService.getSubmissions(page, size, companyId, storeId, repId, stars, auth.getName()));
  }

  @GetMapping("/{id}")
  public ResponseEntity<SubmissionDetailDto> getSubmission(
      @PathVariable UUID id, Authentication auth) {
    return ResponseEntity.ok(submissionService.getSubmissionDetail(id, auth.getName()));
  }

  @GetMapping("/flagged")
  public ResponseEntity<List<FlaggedSubmissionDto>> getFlagged(
      @RequestParam(required = false) UUID companyId, Authentication auth) {
    return ResponseEntity.ok(reviewService.getFlagged(auth.getName(), companyId));
  }

  @PostMapping("/{id}/review")
  public ResponseEntity<Void> review(
      @PathVariable UUID id,
      @Valid @RequestBody ReviewRequestDto dto,
      Authentication auth) {
    reviewService.review(id, dto, auth.getName());
    return ResponseEntity.noContent().build();
  }
}
