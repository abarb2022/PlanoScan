package com.example.demo.dto.rep;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RepRequestDto {
  @NotBlank(message = "Name is required") private String name;

  @Email @NotBlank(message = "Email is required") private String email;

  private UUID companyId;
}
