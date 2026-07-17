package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(
    name = "store_assignments",
    uniqueConstraints = {
      @UniqueConstraint(
          name = "store_assignments_rule_date",
          columnNames = {"rule_id", "assignment_date"})
    },
    indexes = {
      @Index(name = "idx_store_assignments_store", columnList = "store_id"),
      @Index(
          name = "idx_store_assignments_assignee_date",
          columnList = "assignee_id, assignment_date"),
      @Index(name = "idx_store_assignments_status", columnList = "status")
    })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreAssignment {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "rule_id")
  private StoreAssignmentRule rule;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "store_id", nullable = false)
  private Store store;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "assignee_id", nullable = false)
  private User assignee;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "assigned_by_user_id", nullable = false)
  private User assignedBy;

  @Column(name = "assignment_date", nullable = false)
  private LocalDate assignmentDate;

  @Column(name = "due_time")
  private LocalTime dueTime;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  @Builder.Default
  private Status status = Status.ASSIGNED;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  //  @Column(name = "completed_at")
  //  private LocalDateTime completedAt;

  @Column(name = "cancelled_at")
  private LocalDateTime cancelledAt;

  @OneToMany(mappedBy = "assignment", fetch = FetchType.LAZY)
  private List<Submission> submissions;

  public enum Status {
    ASSIGNED,
    COMPLETED,
    MISSED,
    CANCELLED
  }
}
