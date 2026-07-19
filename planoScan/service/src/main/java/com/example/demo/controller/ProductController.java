package com.example.demo.controller;

import com.example.demo.dto.product.ProductPageResponseDto;
import com.example.demo.dto.product.ProductRequestDto;
import com.example.demo.dto.product.ProductResponseDto;
import com.example.demo.service.ProductService;
import jakarta.validation.Valid;
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
@RequestMapping("/api/manager/products")
@CrossOrigin(origins = {"http://127.0.0.1:5173", "http://localhost:5173"})
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
public class ProductController {

  private final ProductService productService;

  @GetMapping
  public ResponseEntity<ProductPageResponseDto> getProducts(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(required = false) UUID companyId,
      Authentication auth) {
    return ResponseEntity.ok(productService.getProducts(page, size, companyId, auth.getName()));
  }

  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<ProductResponseDto> createProduct(
      @RequestPart("data") @Valid ProductRequestDto dto,
      @RequestPart(value = "referenceImage", required = false) MultipartFile referenceImage,
      Authentication auth) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(productService.createProduct(dto, referenceImage, auth.getName()));
  }

  @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<ProductResponseDto> updateProduct(
      @PathVariable UUID id,
      @RequestPart("data") @Valid ProductRequestDto dto,
      @RequestPart(value = "referenceImage", required = false) MultipartFile referenceImage,
      Authentication auth) {
    return ResponseEntity.ok(productService.updateProduct(id, dto, referenceImage, auth.getName()));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteProduct(@PathVariable UUID id, Authentication auth) {
    productService.deleteProduct(id, auth.getName());
    return ResponseEntity.noContent().build();
  }
}
