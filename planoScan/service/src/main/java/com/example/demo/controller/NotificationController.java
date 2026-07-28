package com.example.demo.controller;

import com.example.demo.dto.notification.NotificationSummaryDto;
import com.example.demo.service.NotificationService;
import java.security.Principal;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rep/notifications")
@CrossOrigin(origins = {"http://127.0.0.1:5173", "http://localhost:5173"})
@RequiredArgsConstructor
@PreAuthorize("hasRole('REP')")
public class NotificationController {

  private final NotificationService notificationService;

  @GetMapping
  public ResponseEntity<NotificationSummaryDto> getNotifications(Principal principal) {
    return ResponseEntity.ok(notificationService.getNotificationsForRep(principal.getName()));
  }

  @GetMapping("/unread-count")
  public ResponseEntity<Long> getUnreadCount(Principal principal) {
    return ResponseEntity.ok(notificationService.getUnreadCount(principal.getName()));
  }

  @PostMapping("/{id}/read")
  public ResponseEntity<Void> markAsRead(@PathVariable UUID id, Principal principal) {
    notificationService.markAsRead(id, principal.getName());
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/read-all")
  public ResponseEntity<Void> markAllAsRead(Principal principal) {
    notificationService.markAllAsRead(principal.getName());
    return ResponseEntity.noContent().build();
  }
}
