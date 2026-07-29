package com.example.demo.dto.product;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ProductResponseDto {
  UUID id;
  String name;
  String code;
  String category;
  String description;
  String referenceImageUrl;
  UUID companyId;
  String companyName;
  LocalDateTime createdAt;
}
