package com.example.demo.service;

import com.example.demo.dto.notification.NotificationDto;
import com.example.demo.dto.notification.NotificationSummaryDto;
import com.example.demo.entity.Notification;
import com.example.demo.entity.Store;
import com.example.demo.entity.StoreAssignmentRule;
import com.example.demo.entity.User;
import com.example.demo.exception.ErrorCode;
import com.example.demo.exception.ServerException;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.UserRepository;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

  private static final int MAX_NOTIFICATIONS = 30;
  private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("MMMM d, yyyy");

  private final NotificationRepository notificationRepository;
  private final UserRepository userRepository;
  private final SimpMessagingTemplate messagingTemplate;

  @Transactional
  public void notifyNewAssignments(List<StoreAssignmentRule> newRules, User assignedBy) {
    if (newRules.isEmpty()) {
      return;
    }

    List<Notification> toSave = new ArrayList<>();
    groupByRepAndStore(newRules)
        .forEach(
            (rep, byStore) ->
                byStore.forEach(
                    (store, rules) ->
                        toSave.add(
                            Notification.builder()
                                .recipient(rep)
                                .triggeredBy(assignedBy)
                                .type(Notification.NotificationType.STORE_ASSIGNMENT)
                                .message(buildAssignmentMessage(assignedBy, store, rules))
                                .build())));

    saveAndPush(toSave);
  }

  @Transactional
  public void notifyRemovedAssignments(List<StoreAssignmentRule> removedRules, User removedBy) {
    if (removedRules.isEmpty()) {
      return;
    }

    List<Notification> toSave = new ArrayList<>();
    groupByRepAndStore(removedRules)
        .forEach(
            (rep, byStore) ->
                byStore.forEach(
                    (store, rules) ->
                        toSave.add(
                            Notification.builder()
                                .recipient(rep)
                                .triggeredBy(removedBy)
                                .type(Notification.NotificationType.STORE_UNASSIGNMENT)
                                .message(buildUnassignmentMessage(removedBy, store, rules))
                                .build())));

    saveAndPush(toSave);
  }

  private Map<User, Map<Store, List<StoreAssignmentRule>>> groupByRepAndStore(
      List<StoreAssignmentRule> rules) {
    return rules.stream()
        .collect(
            Collectors.groupingBy(
                StoreAssignmentRule::getAssignee,
                Collectors.groupingBy(StoreAssignmentRule::getStore)));
  }

  private void saveAndPush(List<Notification> toSave) {
    notificationRepository.saveAll(toSave);
    toSave.forEach(
        notification ->
            messagingTemplate.convertAndSendToUser(
                notification.getRecipient().getEmail(),
                "/queue/notifications",
                toDto(notification)));
  }

  private String buildAssignmentMessage(User assignedBy, Store store, List<StoreAssignmentRule> rules) {
    return actorName(assignedBy)
        + " assigned you to "
        + store.getName()
        + " on "
        + formatDays(rules)
        + formatDateRange(rules)
        + ".";
  }

  private String buildUnassignmentMessage(
      User removedBy, Store store, List<StoreAssignmentRule> rules) {
    return actorName(removedBy)
        + " removed your "
        + formatDays(rules)
        + " assignment at "
        + store.getName()
        + ".";
  }

  private String actorName(User actor) {
    return actor != null ? actor.getName() : "Your manager";
  }

  private String formatDays(List<StoreAssignmentRule> rules) {
    return rules.stream()
        .map(StoreAssignmentRule::getDayOfWeek)
        .distinct()
        .sorted(Comparator.comparingInt(DayOfWeek::getValue))
        .map(day -> day.getDisplayName(TextStyle.FULL, Locale.ENGLISH))
        .collect(Collectors.joining(", "));
  }

  private String formatDateRange(List<StoreAssignmentRule> rules) {
    LocalDate from =
        rules.stream().map(StoreAssignmentRule::getValidFrom).min(LocalDate::compareTo).orElse(null);
    if (from == null) {
      return "";
    }
    boolean anyOpenEnded = rules.stream().anyMatch(r -> r.getValidUntil() == null);
    LocalDate until =
        anyOpenEnded
            ? null
            : rules.stream()
                .map(StoreAssignmentRule::getValidUntil)
                .max(LocalDate::compareTo)
                .orElse(null);

    String result = " starting " + from.format(DATE_FORMAT);
    if (until != null) {
      result += " through " + until.format(DATE_FORMAT);
    }
    return result;
  }

  @Transactional(readOnly = true)
  public NotificationSummaryDto getNotificationsForRep(String email) {
    User rep = getCurrentUser(email);
    List<Notification> notifications =
        notificationRepository.findByRecipientIdOrderByCreatedAtDesc(
            rep.getId(), PageRequest.of(0, MAX_NOTIFICATIONS));
    long unreadCount = notificationRepository.countByRecipientIdAndReadFalse(rep.getId());

    return NotificationSummaryDto.builder()
        .unreadCount(unreadCount)
        .notifications(notifications.stream().map(this::toDto).toList())
        .build();
  }

  @Transactional(readOnly = true)
  public long getUnreadCount(String email) {
    User rep = getCurrentUser(email);
    return notificationRepository.countByRecipientIdAndReadFalse(rep.getId());
  }

  @Transactional
  public void markAsRead(UUID notificationId, String email) {
    User rep = getCurrentUser(email);
    Notification notification =
        notificationRepository
            .findByIdAndRecipientId(notificationId, rep.getId())
            .orElseThrow(() -> new ServerException(ErrorCode.NOTIFICATION_NOT_FOUND));

    if (!notification.isRead()) {
      notification.setRead(true);
      notificationRepository.save(notification);
    }
  }

  @Transactional
  public void markAllAsRead(String email) {
    User rep = getCurrentUser(email);
    notificationRepository.markAllAsReadForRecipient(rep.getId());
  }

  private User getCurrentUser(String email) {
    return userRepository
        .findByEmail(email)
        .orElseThrow(() -> new ServerException(ErrorCode.USER_NOT_FOUND));
  }

  private NotificationDto toDto(Notification notification) {
    return NotificationDto.builder()
        .id(notification.getId())
        .type(notification.getType().name())
        .message(notification.getMessage())
        .read(notification.isRead())
        .createdAt(notification.getCreatedAt())
        .build();
  }
}
