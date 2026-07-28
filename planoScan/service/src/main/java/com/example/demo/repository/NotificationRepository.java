package com.example.demo.repository;

import com.example.demo.entity.Notification;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

  List<Notification> findByRecipientIdOrderByCreatedAtDesc(UUID recipientId, Pageable pageable);

  long countByRecipientIdAndReadFalse(UUID recipientId);

  Optional<Notification> findByIdAndRecipientId(UUID id, UUID recipientId);

  @Modifying
  @Query(
      "UPDATE Notification n SET n.read = true WHERE n.recipient.id = :recipientId AND n.read = false")
  void markAllAsReadForRecipient(@Param("recipientId") UUID recipientId);
}
