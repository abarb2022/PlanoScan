package com.example.demo.controller;

import com.example.demo.dto.dashboard.ManagerDashboardResponseDto;
import com.example.demo.dto.dashboard.ManagerRepWeekDetailDto;
import com.example.demo.service.ManagerDashboardService;
import java.time.LocalDate;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/manager/dashboard")
@CrossOrigin(origins = {"http://127.0.0.1:5173", "http://localhost:5173"})
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
public class ManagerDashboardController {

  private final ManagerDashboardService dashboardService;

  @GetMapping("/overview")
  public ResponseEntity<ManagerDashboardResponseDto> getOverview(
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart,
      @RequestParam(required = false) UUID companyId,
      Authentication auth) {
    LocalDate resolvedWeekStart = weekStart != null ? weekStart : LocalDate.now();
    return ResponseEntity.ok(
        dashboardService.getWeeklyOverview(resolvedWeekStart, companyId, auth.getName()));
  }

  @GetMapping("/reps/{repId}")
  public ResponseEntity<ManagerRepWeekDetailDto> getRepWeekDetail(
      @PathVariable UUID repId,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart,
      Authentication auth) {
    LocalDate resolvedWeekStart = weekStart != null ? weekStart : LocalDate.now();
    return ResponseEntity.ok(
        dashboardService.getRepWeekDetail(repId, resolvedWeekStart, auth.getName()));
  }
}
