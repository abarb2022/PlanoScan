package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(
    name = "store_assignment_rules",
    indexes = {
      @Index(name = "idx_store_assignment_rules_store", columnList = "store_id"),
      @Index(name = "idx_store_assignment_rules_assignee", columnList = "assignee_id"),
      @Index(name = "idx_store_assignment_rules_day", columnList = "day_of_week")
    })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreAssignmentRule {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "store_id", nullable = false)
  private Store store;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "assignee_id", nullable = false)
  private User assignee;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "assigned_by_user_id", nullable = false)
  private User assignedBy;

  @Enumerated(EnumType.STRING)
  @Column(name = "repeat_type", nullable = false)
  @Builder.Default
  private RepeatType repeatType = RepeatType.WEEKLY;

  @Enumerated(EnumType.STRING)
  @Column(name = "day_of_week", nullable = false)
  private DayOfWeek dayOfWeek;

  @Column(name = "valid_from", nullable = false)
  private LocalDate validFrom;

  @Column(name = "valid_until")
  private LocalDate validUntil;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @OneToMany(mappedBy = "rule", fetch = FetchType.LAZY)
  private List<StoreAssignment> assignments;

  public enum RepeatType {
    WEEKLY
  }
}
