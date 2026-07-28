package com.example.demo.dto.notification;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {

  private UUID id;
  private String type;
  private String message;
  private boolean read;
  private LocalDateTime createdAt;
}
