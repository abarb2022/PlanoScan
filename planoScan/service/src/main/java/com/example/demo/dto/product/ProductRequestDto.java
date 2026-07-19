package com.example.demo.dto.product;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;
import lombok.Data;

@Data
public class ProductRequestDto {
  @NotBlank private String name;
  private String sku;
  private String description;
  private UUID companyId;
}
