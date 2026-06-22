package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "stores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Store {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(nullable = false)
  private String name;

  @Column private String address;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "company_id", nullable = false)
  private Company company;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @OneToMany(mappedBy = "store", fetch = FetchType.LAZY)
  private List<PlanogramAssignment> planogramAssignments;

  @OneToMany(mappedBy = "store", fetch = FetchType.LAZY)
  private List<Submission> submissions;

  @OneToMany(mappedBy = "store", fetch = FetchType.LAZY)
  private List<StoreAssignmentRule> assignmentRules;

  @OneToMany(mappedBy = "store", fetch = FetchType.LAZY)
  private List<StoreAssignment> assignments;
}
