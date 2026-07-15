package com.example.demo.dto.store;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreRequestDto {

  @NotBlank(message = "Store name is required") private String name;

  private String address;

  @NotNull(message = "Company ID is required") private UUID companyId;
}
