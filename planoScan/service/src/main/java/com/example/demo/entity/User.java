package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(nullable = false)
  private String name;

  @Column
  private String surname;

  @Column(nullable = false, unique = true)
  private String email;

  @Column
  private String phone;

  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Role role;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "company_id", nullable = false)
  private Company company;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @OneToMany(mappedBy = "rep", fetch = FetchType.LAZY)
  private List<Submission> submissions;

  @OneToMany(mappedBy = "manager", fetch = FetchType.LAZY)
  private List<Feedback> feedbacks;

  @OneToMany(mappedBy = "assignee", fetch = FetchType.LAZY)
  private List<StoreAssignmentRule> assignmentRules;

  @OneToMany(mappedBy = "assignedBy", fetch = FetchType.LAZY)
  private List<StoreAssignmentRule> createdAssignmentRules;

  @OneToMany(mappedBy = "assignee", fetch = FetchType.LAZY)
  private List<StoreAssignment> assignments;

  @OneToMany(mappedBy = "assignedBy", fetch = FetchType.LAZY)
  private List<StoreAssignment> createdAssignments;

  @Column(name = "must_change_password", nullable = false)
  @Builder.Default
  private boolean mustChangePassword = false;

  public enum Role {
    REP,
    MANAGER,
    ADMIN
  }
}
