package com.example.demo.controller;

import com.example.demo.dto.rep.RepPageResponseDto;
import com.example.demo.dto.rep.RepRequestDto;
import com.example.demo.dto.rep.RepResponseDto;
import com.example.demo.dto.store.StoreResponseDto;
import com.example.demo.service.RepService;
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
@RequestMapping("/api/manager/reps")
@CrossOrigin(origins = {"http://127.0.0.1:5173", "http://localhost:5173"})
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
public class RepController {

  private final RepService repService;

  @PostMapping
  public ResponseEntity<RepResponseDto> createRep(
      @Valid @RequestBody RepRequestDto dto, Authentication auth) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(repService.createRep(dto, auth.getName()));
  }

  @GetMapping
  public ResponseEntity<RepPageResponseDto> getReps(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      Authentication auth) {
    return ResponseEntity.ok(repService.getReps(page, size, auth.getName()));
  }

  @GetMapping("/{id}")
  public ResponseEntity<RepResponseDto> getRep(@PathVariable UUID id) {
    return ResponseEntity.ok(repService.getRepById(id));
  }

  @PutMapping("/{id}")
  public ResponseEntity<RepResponseDto> updateRep(
      @PathVariable UUID id, @Valid @RequestBody RepRequestDto dto) {
    return ResponseEntity.ok(repService.updateRep(id, dto));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteRep(@PathVariable UUID id) {
    repService.deleteRep(id);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/available-stores")
  public ResponseEntity<List<StoreResponseDto>> getAvailableStores(Authentication auth) {
    return ResponseEntity.ok(repService.getAvailableStores(auth.getName()));
  }
}
