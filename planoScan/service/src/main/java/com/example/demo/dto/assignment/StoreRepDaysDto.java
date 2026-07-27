package com.example.demo.dto.assignment;

import jakarta.validation.constraints.NotNull;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StoreRepDaysDto {
  @NotNull private UUID storeId;

  @NotNull private UUID repId;

  @NotNull private List<DayOfWeek> days;

  @NotNull private LocalDate validFrom;

  private LocalDate validUntil;
}
