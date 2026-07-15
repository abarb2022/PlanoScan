package com.example.demo.controller;

import com.example.demo.dto.assignment.AssignmentRuleRequestDto;
import com.example.demo.dto.assignment.AssignmentRuleResponseDto;
import com.example.demo.service.StoreAssignmentRuleService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/manager/assignment-rules")
@CrossOrigin(origins = {"http://127.0.0.1:5173", "http://localhost:5173"})
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
public class StoreAssignmentRuleController {

  private final StoreAssignmentRuleService ruleService;

  @PostMapping
  public ResponseEntity<List<AssignmentRuleResponseDto>> createRules(
      @Valid @RequestBody AssignmentRuleRequestDto dto, Authentication auth) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(ruleService.createRules(dto, auth.getName()));
  }

  @GetMapping
  public ResponseEntity<List<AssignmentRuleResponseDto>> getRulesForRep(@RequestParam UUID repId) {
    return ResponseEntity.ok(ruleService.getRulesForRep(repId));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteRule(@PathVariable UUID id) {
    ruleService.deleteRule(id);
    return ResponseEntity.noContent().build();
  }
}
