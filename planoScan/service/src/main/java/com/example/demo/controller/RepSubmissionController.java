package com.example.demo.controller;

import com.example.demo.dto.rep.RepAssignmentResponseDto;
import com.example.demo.service.RepAssignmentService;
import java.security.Principal;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/rep/assignments")
@CrossOrigin(origins = {"http://127.0.0.1:5173", "http://localhost:5173"})
@RequiredArgsConstructor
@PreAuthorize("hasRole('REP')")
public class RepSubmissionController {

  private final RepAssignmentService repAssignmentService;

  @PostMapping(value = "/{id}/submissions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<RepAssignmentResponseDto> createSubmission(
      Principal principal,
      @PathVariable(name = "id") UUID id,
      @RequestParam(name = "photos") List<MultipartFile> photos) {
    return ResponseEntity.ok(
        repAssignmentService.createSubmission(principal.getName(), id, photos));
  }
}
