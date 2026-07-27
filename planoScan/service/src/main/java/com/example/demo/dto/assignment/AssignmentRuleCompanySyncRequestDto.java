package com.example.demo.dto.assignment;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentRuleCompanySyncRequestDto {
  private UUID companyId;

  @NotNull @Valid private List<StoreRepDaysDto> assignments;
}
