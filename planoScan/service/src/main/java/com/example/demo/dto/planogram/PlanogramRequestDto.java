package com.example.demo.dto.planogram;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Data;

@Data
public class PlanogramRequestDto {
  @NotBlank private String name;
  @NotNull private UUID storeId;
  private String productCategory;
  private LocalDate validFrom;
  private LocalDate validUntil;
}
