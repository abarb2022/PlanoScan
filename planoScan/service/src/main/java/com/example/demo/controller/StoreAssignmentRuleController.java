package com.example.demo.controller;

import com.example.demo.dto.assignment.AssignmentRuleCompanySyncRequestDto;
import com.example.demo.dto.assignment.AssignmentRuleResponseDto;
import com.example.demo.service.StoreAssignmentRuleService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
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

  @GetMapping
  public ResponseEntity<List<AssignmentRuleResponseDto>> getRulesForCompany(
      @RequestParam(required = false) UUID companyId, Authentication auth) {
    return ResponseEntity.ok(ruleService.getRulesForCompany(companyId, auth.getName()));
  }

  @PutMapping("/sync")
  public ResponseEntity<List<AssignmentRuleResponseDto>> syncRules(
      @Valid @RequestBody AssignmentRuleCompanySyncRequestDto dto, Authentication auth) {
    return ResponseEntity.ok(ruleService.syncRulesForCompany(dto, auth.getName()));
  }
}
