package com.example.demo.controller;

import com.example.demo.dto.review.FlaggedSubmissionDto;
import com.example.demo.dto.review.ReviewRequestDto;
import com.example.demo.service.SubmissionReviewService;
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

  @GetMapping("/flagged")
  public ResponseEntity<List<FlaggedSubmissionDto>> getFlagged(
      @RequestParam(required = false) UUID companyId, Authentication auth) {
    return ResponseEntity.ok(reviewService.getFlagged(companyId));
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
