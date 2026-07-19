package com.example.demo.dto.response;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UserProfileDto {
  String email;
  String role;
  String companyName;
}
