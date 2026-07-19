package com.example.demo.dto.product;

import java.util.List;

public record ProductPageResponseDto(
    List<ProductResponseDto> content,
    int totalPages,
    long totalElements,
    int currentPage) {}
