package com.example.demo.controller;

import com.example.demo.dto.company.CompanyRequestDto;
import com.example.demo.dto.company.CompanyResponseDto;
import com.example.demo.service.CompanyService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/companies")
@CrossOrigin(origins = {"http://127.0.0.1:5173", "http://localhost:5173"})
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class CompanyController {

  private final CompanyService companyService;

  @GetMapping
  public ResponseEntity<List<CompanyResponseDto>> getCompanies() {
    return ResponseEntity.ok(companyService.getAll());
  }

  @PostMapping
  public ResponseEntity<CompanyResponseDto> createCompany(@Valid @RequestBody CompanyRequestDto dto) {
    return ResponseEntity.status(HttpStatus.CREATED).body(companyService.create(dto));
  }

  @PutMapping("/{id}")
  public ResponseEntity<CompanyResponseDto> updateCompany(
      @PathVariable UUID id, @Valid @RequestBody CompanyRequestDto dto) {
    return ResponseEntity.ok(companyService.update(id, dto));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteCompany(@PathVariable UUID id) {
    companyService.delete(id);
    return ResponseEntity.noContent().build();
  }
}
