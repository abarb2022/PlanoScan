package com.example.demo.controller;

import com.example.demo.dto.manager.ManagerPageResponseDto;
import com.example.demo.dto.manager.ManagerRequestDto;
import com.example.demo.dto.manager.ManagerResponseDto;
import com.example.demo.service.ManagerService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/managers")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ManagerController {

  private final ManagerService managerService;

  @PostMapping
  public ResponseEntity<ManagerResponseDto> createManager(
      @Valid @RequestBody ManagerRequestDto dto) {
    return ResponseEntity.status(HttpStatus.CREATED).body(managerService.createManager(dto));
  }

  @GetMapping
  public ResponseEntity<ManagerPageResponseDto> getManagers(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(required = false) UUID companyId) {
    return ResponseEntity.ok(managerService.getManagers(page, size, companyId));
  }

  @PutMapping("/{id}")
  public ResponseEntity<ManagerResponseDto> updateManager(
      @PathVariable UUID id, @Valid @RequestBody ManagerRequestDto dto) {
    return ResponseEntity.ok(managerService.updateManager(id, dto));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteManager(@PathVariable UUID id) {
    managerService.deleteManager(id);
    return ResponseEntity.noContent().build();
  }
}
