package com.example.demo.dto.assignment;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class AssignmentRuleRequestDto {
  @NotNull private UUID storeId;

  @NotNull private UUID repId;

  @NotNull @Size(min = 1, message = "At least one day must be selected") private List<DayOfWeek> days;

  @NotNull private LocalDate validFrom;

  private LocalDate validUntil;
}
