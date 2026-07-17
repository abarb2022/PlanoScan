package com.example.demo.dto.manager;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ManagerRequestDto {
  @NotBlank(message = "Name is required") private String name;

  private String surname;

  @Email @NotBlank(message = "Email is required") private String email;

  private String phone;

  @NotNull(message = "Company is required") private UUID companyId;
}
