package com.example.demo.controller;

import com.example.demo.dto.planogram.PlanogramRequestDto;
import com.example.demo.dto.planogram.PlanogramResponseDto;
import com.example.demo.service.PlanogramService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/manager/planograms")
@CrossOrigin(origins = {"http://127.0.0.1:5173", "http://localhost:5173"})
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
public class PlanogramController {

  private final PlanogramService planogramService;

  @GetMapping
  public ResponseEntity<List<PlanogramResponseDto>> getPlanograms(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      Authentication auth) {
    return ResponseEntity.ok(planogramService.getPlanograms(page, size, auth.getName()));
  }

  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<PlanogramResponseDto> createPlanogram(
      @RequestPart("data") @Valid PlanogramRequestDto dto,
      @RequestPart(value = "image", required = false) MultipartFile image,
      Authentication auth) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(planogramService.createPlanogram(dto, image, auth.getName()));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deletePlanogram(@PathVariable UUID id, Authentication auth) {
    planogramService.deletePlanogram(id, auth.getName());
    return ResponseEntity.noContent().build();
  }
}
