package com.example.demo.controller;

import com.example.demo.dto.rep.RepAssignmentPageResponseDto;
import com.example.demo.service.AssignmentGenerationService;
import com.example.demo.service.RepAssignmentService;
import java.security.Principal;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rep/assignments")
@CrossOrigin(origins = {"http://127.0.0.1:5173", "http://localhost:5173"})
@RequiredArgsConstructor
@PreAuthorize("hasRole('REP')")
public class RepAssignmentController {

  private final RepAssignmentService repAssignmentService;
  private final AssignmentGenerationService assignmentGenerationService;

  @GetMapping
  public ResponseEntity<RepAssignmentPageResponseDto> getAssignments(
      Principal principal,
      @RequestParam(name = "tab", defaultValue = "active") String tab,
      @RequestParam(name = "date", defaultValue = "all") String date,
      @RequestParam(name = "status", defaultValue = "all") String status,
      @RequestParam(name = "storeName", defaultValue = "") String storeName,
      @RequestParam(name = "page", defaultValue = "0") int page,
      @RequestParam(name = "size", defaultValue = "20") int size) {
    assignmentGenerationService.ensureTodaysAssignments(principal.getName(), LocalDate.now());
    return ResponseEntity.ok(
        repAssignmentService.getAssignments(principal.getName(), tab, date, status, storeName, page, size));
  }
}
